#!/usr/bin/env node

// Test script to verify ADK Bridge API format
// Run this to test the bridge before using it in the app

const BRIDGE_URL = 'http://localhost:8001';

async function testBridge() {
  console.log('🧪 Testing ADK Bridge API...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await fetch(`${BRIDGE_URL}/`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      return;
    }
    
    // Test 2: Test run-agents endpoint with correct multipart/form-data format
    console.log('\n2️⃣ Testing run-agents endpoint (multipart/form-data)...');
    const formData = new FormData();
    formData.append('feeds', 'Official');
    formData.append('feeds', 'Social');
    
    const formResponse = await fetch(`${BRIDGE_URL}/api/run-agents`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    if (formResponse.ok) {
      const responseData = await formResponse.json();
      console.log('✅ Multipart form data request passed:', responseData);
    } else {
      const errorText = await formResponse.text();
      console.log('❌ Multipart form data request failed:', formResponse.status, errorText);
    }
    
    console.log('\n🎉 Bridge API testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBridge();
