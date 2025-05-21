const fs = require('fs');

// 读取原始文件内容
const content = fs.readFileSync('renderer.js', 'utf8');

// 定义要查找的函数模式
const functionPattern = /async function changeMaxLevel\(\) \{\s+settings\.maxLevel = parseInt\(maxLevelSlider\.value\);\s+try \{\s+await ipcRenderer\.invoke\('update-settings', settings\);\s+updateMaxLevelPreview\(\);\s+\} catch \(error\) \{\s+console\.error\('更新最大层级设置失败:', error\);\s+\}\s+\}/;

// 定义替换的新函数
const newFunction = `async function changeMaxLevel() {
  settings.maxLevel = parseInt(maxLevelSlider.value);
  
  try {
    await ipcRenderer.invoke('update-settings', settings);
    updateMaxLevelPreview();
    // 重新加载笔记列表以应用新的层级限制
    await loadNotes();
    showToast(\`已设置最大层级为\${settings.maxLevel}级\`);
  } catch (error) {
    console.error('更新最大层级设置失败:', error);
  }
}`;

// 执行替换
const newContent = content.replace(functionPattern, newFunction);

// 写回文件
fs.writeFileSync('renderer.js', newContent, 'utf8');

console.log('函数更新完成！'); 