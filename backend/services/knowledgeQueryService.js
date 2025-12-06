/**
 * Knowledge Query Service
 * Provides SQL-based queries for structured knowledge base data
 * Used for direct lookups (employees, managers, tasks) vs. semantic search
 */

import { supabaseAdmin } from '../config/database.js';
import logger from '../config/logger.js';

// ============================================================================
// EMPLOYEE QUERIES
// ============================================================================

/**
 * Get employee by email with their manager details
 * @param {string} email - Employee email address
 * @returns {Object|null} Employee with manager info or null
 */
export async function getEmployeeByEmail(email) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_employee_by_email', { p_email: email });

    if (error) {
      logger.error('Error in getEmployeeByEmail', { email, error: error.message });
      return null;
    }

    if (data && data.length > 0) {
      return {
        employee: data[0].employee,
        manager: data[0].manager
      };
    }
    return null;
  } catch (error) {
    logger.error('Exception in getEmployeeByEmail', { email, error: error.message });
    return null;
  }
}

/**
 * Get employee by ID with their manager details
 * @param {string} employeeId - Employee ID (e.g., "E001")
 * @returns {Object|null} Employee with manager info or null
 */
export async function getEmployeeById(employeeId) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_employee_by_id', { p_employee_id: employeeId });

    if (error) {
      logger.error('Error in getEmployeeById', { employeeId, error: error.message });
      return null;
    }

    if (data && data.length > 0) {
      return {
        employee: data[0].employee,
        manager: data[0].manager
      };
    }
    return null;
  } catch (error) {
    logger.error('Exception in getEmployeeById', { employeeId, error: error.message });
    return null;
  }
}

/**
 * Get employee with manager using Supabase query (alternative to RPC)
 * @param {string} employeeId - Employee ID
 * @returns {Object|null} Employee with nested manager
 */
export async function getEmployeeWithManager(employeeId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('kb_employees')
      .select('*, manager:manager_id(*)')
      .eq('id', employeeId)
      .single();

    if (error) {
      logger.warn('Employee not found', { employeeId, error: error.message });
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Exception in getEmployeeWithManager', { employeeId, error: error.message });
    return null;
  }
}

/**
 * Search employees by name (fuzzy match)
 * @param {string} name - Name to search for
 * @returns {Array} Matching employees
 */
export async function searchEmployeesByName(name) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('search_employees_by_name', { p_name: name });

    if (error) {
      logger.error('Error in searchEmployeesByName', { name, error: error.message });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Exception in searchEmployeesByName', { name, error: error.message });
    return [];
  }
}

/**
 * Get all employees in a department
 * @param {string} department - Department name
 * @returns {Array} Employees in department
 */
export async function getTeamByDepartment(department) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_team_by_department', { p_department: department });

    if (error) {
      logger.error('Error in getTeamByDepartment', { department, error: error.message });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Exception in getTeamByDepartment', { department, error: error.message });
    return [];
  }
}

/**
 * Get direct reports for a manager
 * @param {string} managerId - Manager's employee ID
 * @returns {Array} Direct reports
 */
export async function getDirectReports(managerId) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_direct_reports', { p_manager_id: managerId });

    if (error) {
      logger.error('Error in getDirectReports', { managerId, error: error.message });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Exception in getDirectReports', { managerId, error: error.message });
    return [];
  }
}

// ============================================================================
// FAQ QUERIES
// ============================================================================

/**
 * Get FAQs relevant to an employee based on their department and role
 * @param {string} employeeId - Employee ID
 * @returns {Array} Relevant FAQs
 */
export async function getFAQsForEmployee(employeeId) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_faqs_for_employee', { p_employee_id: employeeId });

    if (error) {
      logger.error('Error in getFAQsForEmployee', { employeeId, error: error.message });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Exception in getFAQsForEmployee', { employeeId, error: error.message });
    return [];
  }
}

/**
 * Get all FAQs by category
 * @param {string} category - FAQ category
 * @returns {Array} FAQs in category
 */
export async function getFAQsByCategory(category) {
  try {
    const { data, error } = await supabaseAdmin
      .from('kb_faqs')
      .select('*')
      .eq('category', category)
      .order('id');

    if (error) {
      logger.error('Error in getFAQsByCategory', { category, error: error.message });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Exception in getFAQsByCategory', { category, error: error.message });
    return [];
  }
}

/**
 * Get FAQ by ID
 * @param {string} faqId - FAQ ID
 * @returns {Object|null} FAQ or null
 */
export async function getFAQById(faqId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('kb_faqs')
      .select('*')
      .eq('id', faqId)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Exception in getFAQById', { faqId, error: error.message });
    return null;
  }
}

// ============================================================================
// ONBOARDING TASK QUERIES
// ============================================================================

/**
 * Get onboarding tasks relevant to an employee based on their department and role
 * @param {string} employeeId - Employee ID
 * @returns {Array} Relevant tasks sorted by priority and deadline
 */
export async function getTasksForEmployee(employeeId) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_tasks_for_employee', { p_employee_id: employeeId });

    if (error) {
      logger.error('Error in getTasksForEmployee', { employeeId, error: error.message });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Exception in getTasksForEmployee', { employeeId, error: error.message });
    return [];
  }
}

/**
 * Get all onboarding tasks by category
 * @param {string} category - Task category
 * @returns {Array} Tasks in category
 */
export async function getTasksByCategory(category) {
  try {
    const { data, error } = await supabaseAdmin
      .from('kb_onboarding_tasks')
      .select('*')
      .eq('category', category)
      .order('id');

    if (error) {
      logger.error('Error in getTasksByCategory', { category, error: error.message });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Exception in getTasksByCategory', { category, error: error.message });
    return [];
  }
}

/**
 * Get onboarding tasks by deadline (Day 1, Week 1, etc.)
 * @param {string} deadline - Deadline string
 * @returns {Array} Tasks with that deadline
 */
export async function getTasksByDeadline(deadline) {
  try {
    const { data, error } = await supabaseAdmin
      .from('kb_onboarding_tasks')
      .select('*')
      .eq('deadline', deadline)
      .order('priority');

    if (error) {
      logger.error('Error in getTasksByDeadline', { deadline, error: error.message });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Exception in getTasksByDeadline', { deadline, error: error.message });
    return [];
  }
}

/**
 * Get task by ID
 * @param {string} taskId - Task ID
 * @returns {Object|null} Task or null
 */
export async function getTaskById(taskId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('kb_onboarding_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Exception in getTaskById', { taskId, error: error.message });
    return null;
  }
}

// ============================================================================
// COMBINED / UTILITY QUERIES
// ============================================================================

/**
 * Get complete employee profile with all related data
 * @param {string} email - Employee email
 * @returns {Object|null} Complete profile or null
 */
export async function getCompleteEmployeeProfile(email) {
  try {
    // Get employee with manager
    const empResult = await getEmployeeByEmail(email);
    if (!empResult?.employee) {
      return null;
    }

    const employeeId = empResult.employee.id;

    // Get relevant FAQs and tasks
    const [faqs, tasks] = await Promise.all([
      getFAQsForEmployee(employeeId),
      getTasksForEmployee(employeeId)
    ]);

    return {
      employee: empResult.employee,
      manager: empResult.manager,
      relevantFAQs: faqs,
      onboardingTasks: tasks,
      tasksSummary: {
        total: tasks.length,
        highPriority: tasks.filter(t => t.priority === 'High').length,
        day1Tasks: tasks.filter(t => t.deadline === 'Day 1').length,
        week1Tasks: tasks.filter(t => t.deadline === 'Week 1').length
      }
    };
  } catch (error) {
    logger.error('Exception in getCompleteEmployeeProfile', { email, error: error.message });
    return null;
  }
}

/**
 * Check if SQL tables have data (for fallback logic)
 * @returns {boolean} True if tables have data
 */
export async function hasRelationalData() {
  try {
    const { count, error } = await supabaseAdmin
      .from('kb_employees')
      .select('*', { count: 'exact', head: true });

    return !error && count > 0;
  } catch (error) {
    return false;
  }
}

export default {
  // Employee queries
  getEmployeeByEmail,
  getEmployeeById,
  getEmployeeWithManager,
  searchEmployeesByName,
  getTeamByDepartment,
  getDirectReports,
  
  // FAQ queries
  getFAQsForEmployee,
  getFAQsByCategory,
  getFAQById,
  
  // Task queries
  getTasksForEmployee,
  getTasksByCategory,
  getTasksByDeadline,
  getTaskById,
  
  // Utility
  getCompleteEmployeeProfile,
  hasRelationalData
};

