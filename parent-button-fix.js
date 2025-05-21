const fs = require('fs');
const path = require('path');

// 检查文件是否已经修改过
const rendererPath = path.join(__dirname, 'renderer.js');
fs.readFile(rendererPath, 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件失败:', err);
    return;
  }

  // 检查文件中是否已包含handleAddParentButtonClick函数
  if (data.includes('function handleAddParentButtonClick()')) {
    console.log('已经添加过"添加父级"按钮功能，无需重复修改');
    return;
  }

  // 找到handleAddButtonClick函数的位置
  const handleAddButtonClickPos = data.indexOf('async function handleAddButtonClick()');
  if (handleAddButtonClickPos === -1) {
    console.error('找不到handleAddButtonClick函数');
    return;
  }

  // 找到函数的结束位置
  let bracketCount = 0;
  let endPos = handleAddButtonClickPos;
  let inString = false;
  let inComment = false;
  let inMultilineComment = false;
  
  for (let i = handleAddButtonClickPos; i < data.length; i++) {
    const char = data[i];
    
    // 检查字符串
    if (char === '"' || char === "'" || char === '`') {
      if (!inComment && !inMultilineComment) {
        inString = !inString;
      }
      continue;
    }
    
    // 检查单行注释
    if (char === '/' && data[i + 1] === '/' && !inString && !inComment && !inMultilineComment) {
      inComment = true;
      continue;
    }
    
    // 检查多行注释开始
    if (char === '/' && data[i + 1] === '*' && !inString && !inComment && !inMultilineComment) {
      inMultilineComment = true;
      continue;
    }
    
    // 检查多行注释结束
    if (char === '*' && data[i + 1] === '/' && !inString && !inComment && inMultilineComment) {
      inMultilineComment = false;
      i++; // 跳过下一个字符
      continue;
    }
    
    // 换行结束单行注释
    if (char === '\n' && inComment) {
      inComment = false;
      continue;
    }
    
    // 计算大括号
    if (!inString && !inComment && !inMultilineComment) {
      if (char === '{') {
        bracketCount++;
      } else if (char === '}') {
        bracketCount--;
        if (bracketCount === 0) {
          endPos = i + 1;
          break;
        }
      }
    }
  }

  // 在handleAddButtonClick函数后插入新函数
  const addParentButtonFunc = `

// 处理添加父级按钮点击
async function handleAddParentButtonClick() {
  // 无论是否选中了笔记，都强制添加为顶级笔记
  isAddingSubnote = false;
  addDialogTitle.textContent = '添加新父级笔记';
}
`;

  const beforeInsert = data.substring(0, endPos);
  const afterInsert = data.substring(endPos);
  const modified = beforeInsert + addParentButtonFunc + afterInsert;

  // 写入修改后的文件
  fs.writeFile(rendererPath, modified, 'utf8', (err) => {
    if (err) {
      console.error('写入文件失败:', err);
      return;
    }
    console.log('成功添加"添加父级"按钮功能');
  });
}); 