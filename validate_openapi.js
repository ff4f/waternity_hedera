const yaml = require('js-yaml');
const fs = require('fs');

try {
  const doc = yaml.load(fs.readFileSync('temp_openapi.yaml', 'utf8'));
  
  console.log('🔍 OpenAPI Validation Results:');
  console.log('✅ OpenAPI Version:', doc.openapi);
  console.log('✅ Title:', doc.info.title);
  console.log('✅ Version:', doc.info.version);
  console.log('✅ Security Schemes:', Object.keys(doc.components.securitySchemes));
  console.log('✅ Total Paths:', Object.keys(doc.paths).length);
  
  console.log('\n📋 Checking Security Schemes:');
  const cookieAuth = doc.components.securitySchemes.cookieAuth;
  console.log('✅ Cookie Auth Type:', cookieAuth.type);
  console.log('✅ Cookie Auth In:', cookieAuth.in);
  console.log('✅ Cookie Auth Name:', cookieAuth.name);
  
  console.log('\n📋 Checking mutation endpoints with examples:');
  const mutations = [
    '/api/auth/login',
    '/api/hcs/events', 
    '/api/settlements/request',
    '/api/settlements/approve',
    '/api/settlements/execute',
    '/api/documents/anchor'
  ];
  
  mutations.forEach(path => {
    const pathObj = doc.paths[path];
    if (pathObj && pathObj.post) {
      const examples = pathObj.post.requestBody?.content?.['application/json']?.examples;
      const responses = pathObj.post.responses;
      const hasSuccessExample = responses['200']?.content?.['application/json']?.examples;
      const hasErrorExample = responses['400']?.content?.['application/json']?.examples;
      
      console.log(`✅ ${path}:`);
      console.log(`   - Request examples: ${examples ? Object.keys(examples).length : 0}`);
      console.log(`   - Success examples: ${hasSuccessExample ? Object.keys(hasSuccessExample).length : 0}`);
      console.log(`   - Error examples: ${hasErrorExample ? Object.keys(hasErrorExample).length : 0}`);
    }
  });
  
  console.log('\n📋 Checking login Set-Cookie description:');
  const loginPath = doc.paths['/api/auth/login'];
  if (loginPath && loginPath.post && loginPath.post.responses['200']) {
    const headers = loginPath.post.responses['200'].headers;
    if (headers && headers['Set-Cookie']) {
      console.log('✅ Set-Cookie header described:', !!headers['Set-Cookie'].description);
      console.log('   Description:', headers['Set-Cookie'].description);
    } else {
      console.log('❌ Set-Cookie header not found in login response');
    }
  }
  
  console.log('\n🎉 OpenAPI spec validation completed!');
  
} catch (e) {
  console.error('❌ Validation failed:', e.message);
  process.exit(1);
}