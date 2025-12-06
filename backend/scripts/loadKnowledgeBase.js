/**
 * Knowledge Base Loader - Hybrid System
 * Loads data into both relational tables (for structured queries)
 * and vector embeddings (for semantic search)
 */

import { processCSVFile } from '../services/knowledgeBaseService.js';
import { supabaseAdmin } from '../config/database.js';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse a CSV file and return array of row objects
 */
function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * Topologically sort employees so managers are inserted before their reports
 * This ensures foreign key constraints are satisfied
 */
function sortEmployeesByManagerDependency(employees) {
  const employeeMap = new Map(employees.map(e => [e.Employee_ID, e]));
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(emp) {
    if (visited.has(emp.Employee_ID)) return;
    if (visiting.has(emp.Employee_ID)) {
      // Circular dependency - just add it
      sorted.push(emp);
      visited.add(emp.Employee_ID);
      return;
    }

    visiting.add(emp.Employee_ID);

    // If manager is an employee ID and exists, visit them first
    if (emp.Manager_ID?.startsWith('E') && employeeMap.has(emp.Manager_ID)) {
      visit(employeeMap.get(emp.Manager_ID));
    }

    visiting.delete(emp.Employee_ID);
    visited.add(emp.Employee_ID);
    sorted.push(emp);
  }

  employees.forEach(emp => visit(emp));
  return sorted;
}

// ============================================================================
// RELATIONAL TABLE LOADERS
// ============================================================================

/**
 * Load employees into kb_employees table
 */
async function loadEmployeesToRelational(employees) {
  console.log('  → Loading into kb_employees table...');
  
  // Clear existing data (cascade will handle junction tables)
  await supabaseAdmin.from('kb_employees').delete().neq('id', '');
  
  // Sort to satisfy foreign key constraints (managers first)
  const sorted = sortEmployeesByManagerDependency(employees);
  
  let successCount = 0;
  for (const emp of sorted) {
    // Only set manager_id if it references another employee (starts with 'E')
    const managerId = emp.Manager_ID?.startsWith('E') ? emp.Manager_ID : null;
    
    const { error } = await supabaseAdmin.from('kb_employees').insert({
      id: emp.Employee_ID,
      first_name: emp.First_Name,
      last_name: emp.Last_Name,
      full_name: emp.Full_Name,
      email: emp.Email,
      department: emp.Department,
      role: emp.Role,
      manager_id: managerId,
      hire_date: emp.Hire_Date || null,
      work_location: emp.Work_Location || 'Office',
      access_level: emp.Access_Level || 'Standard',
      preferred_language: emp.Preferred_Language || 'English',
      onboarding_status: emp.Onboarding_Status || 'Not Started',
      required_tools: emp.Required_Tools?.split(';').map(t => t.trim()) || []
    });

    if (error) {
      console.error(`    ❌ Error inserting employee ${emp.Employee_ID}:`, error.message);
    } else {
      successCount++;
    }
  }
  
  console.log(`  ✓ Inserted ${successCount}/${employees.length} employees into relational table`);
  return successCount;
}

/**
 * Load FAQs into kb_faqs table with junction tables
 */
async function loadFAQsToRelational(faqs) {
  console.log('  → Loading into kb_faqs table...');
  
  // Clear existing data
  await supabaseAdmin.from('kb_faq_roles').delete().neq('faq_id', '');
  await supabaseAdmin.from('kb_faq_departments').delete().neq('faq_id', '');
  await supabaseAdmin.from('kb_faqs').delete().neq('id', '');
  
  let successCount = 0;
  for (const faq of faqs) {
    // Insert FAQ
    const { error: faqError } = await supabaseAdmin.from('kb_faqs').insert({
      id: faq.FAQ_ID,
      question: faq.Question,
      answer: faq.Answer,
      category: faq.Category,
      difficulty_level: faq.Difficulty_Level || null,
      context_tags: faq.Context_Tags?.split(';').map(t => t.trim()) || [],
      last_updated: faq.Last_Updated || null
    });

    if (faqError) {
      console.error(`    ❌ Error inserting FAQ ${faq.FAQ_ID}:`, faqError.message);
      continue;
    }

    // Insert department relations
    const departments = faq.Related_Departments?.split(',').map(d => d.trim()).filter(d => d) || [];
    for (const dept of departments) {
      await supabaseAdmin.from('kb_faq_departments').insert({
        faq_id: faq.FAQ_ID,
        department: dept
      });
    }

    // Insert role relations
    const roles = faq.Roles_Concerned?.split(';').map(r => r.trim()).filter(r => r) || ['All'];
    for (const role of roles) {
      await supabaseAdmin.from('kb_faq_roles').insert({
        faq_id: faq.FAQ_ID,
        role: role
      });
    }

    successCount++;
  }
  
  console.log(`  ✓ Inserted ${successCount}/${faqs.length} FAQs into relational table`);
  return successCount;
}

/**
 * Load onboarding tasks into kb_onboarding_tasks table with junction table
 */
async function loadTasksToRelational(tasks) {
  console.log('  → Loading into kb_onboarding_tasks table...');
  
  // Clear existing data
  await supabaseAdmin.from('kb_task_roles').delete().neq('task_id', '');
  await supabaseAdmin.from('kb_onboarding_tasks').delete().neq('id', '');
  
  let successCount = 0;
  for (const task of tasks) {
    // Skip empty rows
    if (!task.Task_ID) continue;
    
    // Insert task
    const { error: taskError } = await supabaseAdmin.from('kb_onboarding_tasks').insert({
      id: task.Task_ID,
      category: task.Category,
      task_name: task.Task_Name,
      description: task.Description || null,
      department: task.Department || null,
      owner: task.Owner || null,
      priority: task.Priority || 'Medium',
      deadline: task.Deadline || null,
      difficulty_level: task.Difficulty_Level || null,
      status: task.Status || 'Not Started',
      last_updated: task.Last_Updated || null
    });

    if (taskError) {
      console.error(`    ❌ Error inserting task ${task.Task_ID}:`, taskError.message);
      continue;
    }

    // Insert role relations
    const roles = task.Applicable_Roles?.split(';').map(r => r.trim()).filter(r => r) || ['All'];
    for (const role of roles) {
      await supabaseAdmin.from('kb_task_roles').insert({
        task_id: task.Task_ID,
        role: role
      });
    }

    successCount++;
  }
  
  console.log(`  ✓ Inserted ${successCount}/${tasks.filter(t => t.Task_ID).length} tasks into relational table`);
  return successCount;
}

// ============================================================================
// MAIN LOADER FUNCTION
// ============================================================================

async function loadKnowledgeBase() {
  try {
    console.log('🚀 Starting HYBRID knowledge base setup...\n');
    console.log('This will load data into both:');
    console.log('  • Relational tables (for structured queries)');
    console.log('  • Vector embeddings (for semantic search)\n');
    console.log('='.repeat(60) + '\n');
    
    const dataDir = path.join(__dirname, '../data');
    
    // ========================================================================
    // PHASE 1: LOAD INTO RELATIONAL TABLES
    // ========================================================================
    console.log('📊 PHASE 1: Loading into RELATIONAL TABLES\n');
    
    // Parse CSV files first
    console.log('Parsing CSV files...');
    const employees = await parseCSVFile(path.join(dataDir, 'NovaTech_Employees.csv'));
    const faqs = await parseCSVFile(path.join(dataDir, 'NovaTech_FAQs.csv'));
    const tasks = await parseCSVFile(path.join(dataDir, 'NovaTech_Onboarding_Tasks.csv'));
    console.log(`  Parsed: ${employees.length} employees, ${faqs.length} FAQs, ${tasks.filter(t => t.Task_ID).length} tasks\n`);
    
    // Load into relational tables
    const relEmployees = await loadEmployeesToRelational(employees);
    const relFaqs = await loadFAQsToRelational(faqs);
    const relTasks = await loadTasksToRelational(tasks);
    
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // ========================================================================
    // PHASE 2: LOAD INTO VECTOR EMBEDDINGS
    // ========================================================================
    console.log('🔮 PHASE 2: Loading into VECTOR EMBEDDINGS\n');
    console.log('(This may take a few minutes due to API rate limits...)\n');
    
    let totalEmbeddings = 0;
    
    // Clear existing embeddings
    console.log('Clearing existing embeddings...');
    await supabaseAdmin.from('knowledge_base').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Load employees with embeddings
    console.log('\n📄 Generating embeddings for NovaTech_Employees.csv...');
    const embEmployees = await processCSVFile(
      path.join(dataDir, 'NovaTech_Employees.csv'),
      'employees'
    );
    console.log(`✅ Created ${embEmployees} employee embeddings\n`);
    totalEmbeddings += embEmployees;
    
    // Load FAQs with embeddings
    console.log('📄 Generating embeddings for NovaTech_FAQs.csv...');
    const embFaqs = await processCSVFile(
      path.join(dataDir, 'NovaTech_FAQs.csv'),
      'faqs'
    );
    console.log(`✅ Created ${embFaqs} FAQ embeddings\n`);
    totalEmbeddings += embFaqs;
    
    // Load tasks with embeddings
    console.log('📄 Generating embeddings for NovaTech_Onboarding_Tasks.csv...');
    const embTasks = await processCSVFile(
      path.join(dataDir, 'NovaTech_Onboarding_Tasks.csv'),
      'onboarding_tasks'
    );
    console.log(`✅ Created ${embTasks} task embeddings\n`);
    totalEmbeddings += embTasks;
    
    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 HYBRID KNOWLEDGE BASE SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 SUMMARY:');
    console.log('\nRelational Tables (SQL queries):');
    console.log(`  • kb_employees:        ${relEmployees} records`);
    console.log(`  • kb_faqs:             ${relFaqs} records`);
    console.log(`  • kb_onboarding_tasks: ${relTasks} records`);
    console.log(`  • Total:               ${relEmployees + relFaqs + relTasks} records`);
    console.log('\nVector Embeddings (semantic search):');
    console.log(`  • knowledge_base:      ${totalEmbeddings} embeddings`);
    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Your hybrid knowledge base is ready!');
    console.log('   - Use SQL functions for: "who is my manager?", "my tasks", etc.');
    console.log('   - Use embeddings for: "how do I reset password?", "tell me about vacation"');
    console.log('\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error loading knowledge base:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the loader
loadKnowledgeBase();
