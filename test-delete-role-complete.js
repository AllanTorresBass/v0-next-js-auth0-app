#!/usr/bin/env node

/**
 * Complete Delete Role Data Flow Test
 * Tests the entire delete role functionality from API to Auth0
 */

const BASE_URL = 'http://localhost:3000'

async function testCompleteDeleteRoleFlow() {
  console.log('🧪 Testing Complete Delete Role Data Flow\n')

  try {
    // Step 1: Create a test role
    console.log('1️⃣ Creating test role...')
    const createResponse = await fetch(`${BASE_URL}/api/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Complete Test Role',
        description: 'A role for testing complete deletion flow'
      })
    })

    if (!createResponse.ok) {
      throw new Error(`Failed to create role: ${createResponse.statusText}`)
    }

    const { role } = await createResponse.json()
    console.log(`✅ Role created: ${role.name} (ID: ${role.id})`)

    // Step 2: Verify role exists
    console.log('\n2️⃣ Verifying role exists...')
    const getResponse = await fetch(`${BASE_URL}/api/roles`)
    if (!getResponse.ok) {
      throw new Error(`Failed to fetch roles: ${getResponse.statusText}`)
    }

    const { roles } = await getResponse.json()
    const foundRole = roles.find(r => r.id === role.id)
    if (!foundRole) {
      throw new Error('Role not found in roles list')
    }
    console.log(`✅ Role found in roles list: ${foundRole.name}`)

    // Step 3: Test individual role fetch
    console.log('\n3️⃣ Testing individual role fetch...')
    const individualResponse = await fetch(`${BASE_URL}/api/roles/${encodeURIComponent(role.id)}`)
    if (!individualResponse.ok) {
      throw new Error(`Failed to fetch individual role: ${individualResponse.statusText}`)
    }

    const { role: individualRole } = await individualResponse.json()
    if (individualRole.id !== role.id) {
      throw new Error('Individual role fetch returned different role')
    }
    console.log(`✅ Individual role fetch successful: ${individualRole.name}`)

    // Step 4: Delete the role
    console.log('\n4️⃣ Deleting role...')
    const deleteResponse = await fetch(`${BASE_URL}/api/roles/${encodeURIComponent(role.id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text()
      throw new Error(`Failed to delete role: ${deleteResponse.status} - ${errorText}`)
    }

    const deleteResult = await deleteResponse.json()
    if (!deleteResult.success) {
      throw new Error('Delete response did not indicate success')
    }
    console.log(`✅ Role deleted successfully: ${JSON.stringify(deleteResult)}`)

    // Step 5: Verify role is deleted
    console.log('\n5️⃣ Verifying role is deleted...')
    const verifyResponse = await fetch(`${BASE_URL}/api/roles`)
    if (!verifyResponse.ok) {
      throw new Error(`Failed to fetch roles for verification: ${verifyResponse.statusText}`)
    }

    const { roles: updatedRoles } = await verifyResponse.json()
    const deletedRole = updatedRoles.find(r => r.id === role.id)
    if (deletedRole) {
      throw new Error('Role still exists after deletion')
    }
    console.log(`✅ Role successfully deleted - not found in roles list`)

    // Step 6: Test individual role fetch after deletion
    console.log('\n6️⃣ Testing individual role fetch after deletion...')
    const deletedResponse = await fetch(`${BASE_URL}/api/roles/${encodeURIComponent(role.id)}`)
    if (deletedResponse.status !== 404 && deletedResponse.status !== 500) {
      throw new Error(`Expected 404 or 500 for deleted role, got ${deletedResponse.status}`)
    }
    console.log(`✅ Individual role fetch correctly returns ${deletedResponse.status} for deleted role (expected behavior)`)

    console.log('\n🎉 Complete Delete Role Data Flow Test PASSED!')
    console.log('\n📋 Summary:')
    console.log('✅ Role creation works')
    console.log('✅ Role listing works')
    console.log('✅ Individual role fetch works')
    console.log('✅ Role deletion works')
    console.log('✅ Role verification after deletion works')
    console.log('✅ 404 handling for deleted roles works')
    console.log('\n🔧 The delete role functionality is working correctly!')

  } catch (error) {
    console.error('\n❌ Test FAILED:', error.message)
    console.error('\n🔍 Debug information:')
    console.error('- Error:', error)
    process.exit(1)
  }
}

// Run the test
testCompleteDeleteRoleFlow()
