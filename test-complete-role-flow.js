#!/usr/bin/env node

/**
 * Complete Role Flow Test
 * Tests the entire role creation and management flow without permissions
 */

const BASE_URL = 'http://localhost:3000'

async function testCompleteRoleFlow() {
  console.log('🧪 Testing Complete Role Flow (No Permissions)\n')

  try {
    // Test 1: Verify permissions API works
    console.log('1️⃣ Testing permissions API...')
    const permissionsResponse = await fetch(`${BASE_URL}/api/permissions`)
    if (!permissionsResponse.ok) {
      throw new Error(`Failed to fetch permissions: ${permissionsResponse.statusText}`)
    }
    
    const { permissions } = await permissionsResponse.json()
    console.log(`✅ Permissions API works: ${permissions.length} permissions available`)
    
    // Test 2: Create role without any permissions (simulating UI behavior)
    console.log('\n2️⃣ Testing role creation without permissions (UI simulation)...')
    const timestamp = Date.now()
    const roleResponse = await fetch(`${BASE_URL}/api/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `UI Test Role ${timestamp}`,
        description: 'A role created through UI without selecting any permissions'
        // Note: No permissions field - this simulates UI behavior when no permissions are selected
      })
    })
    
    if (!roleResponse.ok) {
      const error = await roleResponse.json()
      throw new Error(`Failed to create role: ${error.error}`)
    }
    
    const { role } = await roleResponse.json()
    console.log(`✅ Role created successfully: ${role.name} (ID: ${role.id})`)
    
    // Test 3: Verify role exists and can be fetched
    console.log('\n3️⃣ Verifying role exists and can be fetched...')
    const getRoleResponse = await fetch(`${BASE_URL}/api/roles/${encodeURIComponent(role.id)}`)
    if (!getRoleResponse.ok) {
      throw new Error(`Failed to fetch individual role: ${getRoleResponse.statusText}`)
    }
    
    const { role: fetchedRole } = await getRoleResponse.json()
    if (fetchedRole.id !== role.id) {
      throw new Error('Fetched role ID does not match created role ID')
    }
    console.log(`✅ Role can be fetched individually: ${fetchedRole.name}`)
    
    // Test 4: Verify role appears in roles list
    console.log('\n4️⃣ Verifying role appears in roles list...')
    const rolesResponse = await fetch(`${BASE_URL}/api/roles`)
    if (!rolesResponse.ok) {
      throw new Error(`Failed to fetch roles list: ${rolesResponse.statusText}`)
    }
    
    const { roles } = await rolesResponse.json()
    const foundRole = roles.find(r => r.id === role.id)
    if (!foundRole) {
      throw new Error('Created role not found in roles list')
    }
    console.log(`✅ Role appears in roles list: ${foundRole.name}`)
    
    // Test 5: Test role update
    console.log('\n5️⃣ Testing role update...')
    const updateResponse = await fetch(`${BASE_URL}/api/roles/${encodeURIComponent(role.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Updated description for UI test role'
      })
    })
    
    if (!updateResponse.ok) {
      const error = await updateResponse.json()
      throw new Error(`Failed to update role: ${error.error}`)
    }
    
    const { role: updatedRole } = await updateResponse.json()
    if (updatedRole.description !== 'Updated description for UI test role') {
      throw new Error('Role description was not updated correctly')
    }
    console.log(`✅ Role updated successfully: ${updatedRole.description}`)
    
    // Test 6: Test role deletion
    console.log('\n6️⃣ Testing role deletion...')
    const deleteResponse = await fetch(`${BASE_URL}/api/roles/${encodeURIComponent(role.id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!deleteResponse.ok) {
      const error = await deleteResponse.json()
      throw new Error(`Failed to delete role: ${error.error}`)
    }
    
    const deleteResult = await deleteResponse.json()
    if (!deleteResult.success) {
      throw new Error('Delete response did not indicate success')
    }
    console.log(`✅ Role deleted successfully`)
    
    // Test 7: Verify role is completely removed
    console.log('\n7️⃣ Verifying role is completely removed...')
    const verifyDeleteResponse = await fetch(`${BASE_URL}/api/roles`)
    if (!verifyDeleteResponse.ok) {
      throw new Error(`Failed to fetch roles for verification: ${verifyDeleteResponse.statusText}`)
    }
    
    const { roles: finalRoles } = await verifyDeleteResponse.json()
    const deletedRole = finalRoles.find(r => r.id === role.id)
    if (deletedRole) {
      throw new Error('Role still exists after deletion')
    }
    console.log(`✅ Role completely removed from Auth0`)
    
    // Test 8: Test role creation with permissions (to ensure both flows work)
    console.log('\n8️⃣ Testing role creation with permissions...')
    const roleWithPermsResponse = await fetch(`${BASE_URL}/api/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `UI Test Role With Permissions ${timestamp}`,
        description: 'A role created with permissions',
        permissions: ['users:read', 'dashboard:view_all']
      })
    })
    
    if (!roleWithPermsResponse.ok) {
      const error = await roleWithPermsResponse.json()
      throw new Error(`Failed to create role with permissions: ${error.error}`)
    }
    
    const { role: roleWithPerms } = await roleWithPermsResponse.json()
    console.log(`✅ Role with permissions created: ${roleWithPerms.name} (ID: ${roleWithPerms.id})`)
    
    // Clean up
    await fetch(`${BASE_URL}/api/roles/${encodeURIComponent(roleWithPerms.id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
    console.log(`✅ Test role with permissions cleaned up`)
    
    console.log('\n🎉 Complete Role Flow Test PASSED!')
    console.log('\n📋 Complete Data Flow Summary:')
    console.log('✅ Permissions API works and returns application permissions')
    console.log('✅ Role creation without permissions works (UI simulation)')
    console.log('✅ Role is properly stored in Auth0')
    console.log('✅ Role can be fetched individually')
    console.log('✅ Role appears in roles list')
    console.log('✅ Role can be updated')
    console.log('✅ Role can be deleted')
    console.log('✅ Role is completely removed from Auth0')
    console.log('✅ Role creation with permissions also works')
    console.log('\n🔧 The entire data flow for role creation without permissions is working correctly!')
    console.log('🔧 The UI will work properly when users create roles without selecting any permissions!')

  } catch (error) {
    console.error('\n❌ Test FAILED:', error.message)
    console.error('\n🔍 Debug information:')
    console.error('- Error:', error)
    process.exit(1)
  }
}

// Run the test
testCompleteRoleFlow()
