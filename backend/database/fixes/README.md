# Fix Scripts

These SQL scripts are **troubleshooting-only** scripts. Only run them if you encounter specific errors.

## When to Use

### `fix-conversations-foreign-key.sql`
**Run if:** You get foreign key constraint errors when creating conversations
- Error: "foreign key constraint fails"
- Error: "violates foreign key constraint"
- Issue: `conversations.user_id` doesn't reference `auth.users.id` correctly

### `fix-knowledge-base-rls.sql`
**Run if:** You can't read from the knowledge_base table
- Error: "new row violates row-level security policy"
- Issue: Knowledge base RLS policies are too restrictive

### `fix-oauth-tokens-rls.sql`
**Run if:** OAuth token operations fail
- Error: "new row violates row-level security policy" on `user_oauth_tokens`
- Issue: OAuth tokens RLS policies are missing or incorrect

### `fix-avatar-storage.sql`
**Run if:** Avatar uploads fail
- Error: "new row violates row-level security policy" on storage
- Error: "bucket not found" or "permission denied"
- Issue: Avatar storage bucket or policies are misconfigured

### `fix-user-profile-trigger.sql`
**Run if:** OAuth sign-in fails with "Database error saving new user"
- Error: "OAuth error: server_error Database error saving new user"
- Error: "Database error saving new user" in console
- Issue: The trigger that creates user profiles on signup is failing

## Important Notes

- ⚠️ These scripts may delete or modify existing data
- ⚠️ Always backup your database before running fix scripts
- ⚠️ Only run the specific fix script for the error you're experiencing
- ✅ The main setup scripts should work without these fixes in most cases

