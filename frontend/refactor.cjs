const { Project, SyntaxKind } = require('ts-morph');

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const sourceFiles = project.getSourceFiles();

sourceFiles.forEach(sourceFile => {
  let changed = false;

  // Change imports
  const imports = sourceFile.getImportDeclarations();
  imports.forEach(imp => {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    if (moduleSpecifier.includes('api_helper')) {
      const namedImports = imp.getNamedImports();
      const removed = [];
      namedImports.forEach(ni => {
        const name = ni.getName();
        if (['apiGet', 'apiPost', 'apiPatch', 'apiDelete'].includes(name)) {
          ni.remove();
          removed.push(name);
          changed = true;
        }
      });
      if (removed.length > 0) {
        // check if 'api' is already imported
        const hasApi = imp.getNamedImports().some(ni => ni.getName() === 'api');
        if (!hasApi) {
          imp.addNamedImport('api');
        }
      }
    }
  });

  // Change CallExpressions
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  callExpressions.forEach(callExpr => {
    const expr = callExpr.getExpression();
    if (expr.getKind() === SyntaxKind.Identifier) {
      const name = expr.getText();
      if (['apiGet', 'apiPost', 'apiPatch', 'apiDelete'].includes(name)) {
        const newMethodName = 'api.' + name.replace('api', '').toLowerCase();
        expr.replaceWithText(newMethodName);
        
        // append .then(res => res.data)
        // Wait, replaceWithText modifies the tree. We can just wrap the whole callExpr
        const fullCallText = callExpr.getText(); // e.g. api.get('/abc')
        // since we just changed the identifier to 'api.get', fullCallText will reflect that?
        // No, it's better to just replace the whole text.
      }
    }
  });

});

// To safely append .then(res => res.data), we can find all calls to apiGet, etc.
// Let's do it directly
sourceFiles.forEach(sourceFile => {
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    // filter backwards to avoid breaking nodes
    const apiCalls = calls.filter(c => {
        const txt = c.getExpression().getText();
        return ['apiGet', 'apiPost', 'apiPatch', 'apiDelete'].includes(txt);
    });
    
    for (let i = apiCalls.length - 1; i >= 0; i--) {
        const call = apiCalls[i];
        const methodName = call.getExpression().getText();
        const newMethod = 'api.' + methodName.replace('api', '').toLowerCase();
        call.getExpression().replaceWithText(newMethod);
        
        call.replaceWithText(call.getText() + '.then(res => res.data)');
    }
    
    if (apiCalls.length > 0) {
        sourceFile.saveSync();
    }
    
    // Also save if imports changed
    const apiHelperImports = sourceFile.getImportStringDeclarations?.() || []; // workaround
    sourceFile.saveSync();
});
