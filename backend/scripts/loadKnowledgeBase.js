import { processCSVFile } from '../services/knowledgeBaseService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadKnowledgeBase() {
  try {
    console.log('🚀 Starting knowledge base setup...\n');
    
    // Path to your CSV files (place them in backend/data folder)
    const dataDir = path.join(__dirname, '../data');
    
    let totalRecords = 0;
    
    // Load employees CSV
    console.log('📄 Loading NovaTech_Employees__30_.csv...');
    const employeesCount = await processCSVFile(
      path.join(dataDir, 'NovaTech_Employees__30_.csv'),
      'employees'
    );
    console.log(`✅ Loaded ${employeesCount} employee records\n`);
    totalRecords += employeesCount;
    
    // Load company FAQs CSV
    console.log('📄 Loading NovaTech_FAQs__Company_.csv...');
    const faqsCount = await processCSVFile(
      path.join(dataDir, 'NovaTech_FAQs__Company_.csv'),
      'faqs'
    );
    console.log(`✅ Loaded ${faqsCount} FAQ records\n`);
    totalRecords += faqsCount;
    
    // Load onboarding tasks CSV
    console.log('📄 Loading NovaTech_Detailed_Onboarding_Tasks.csv...');
    const tasksCount = await processCSVFile(
      path.join(dataDir, 'NovaTech_Detailed_Onboarding_Tasks.csv'),
      'onboarding_tasks'
    );
    console.log(`✅ Loaded ${tasksCount} onboarding task records\n`);
    totalRecords += tasksCount;
    
    console.log('='.repeat(50));
    console.log('🎉 Knowledge base setup complete!');
    console.log(`📊 Total records: ${totalRecords}`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error loading knowledge base:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

loadKnowledgeBase();

