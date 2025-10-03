#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000'

async function testErrorHandling() {
  console.log('Testing error handling for non-existent role...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/roles/nonexistent-role-id`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
    
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testErrorHandling()
