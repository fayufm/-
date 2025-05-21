const fs = require('fs');

// 读取原始文件内容
const content = fs.readFileSync('renderer.js', 'utf8');

// 查找并替换层级限制提示的实现方式
// 原有的内嵌提示消息
const oldCode = `      // 添加新的层级限制提示
      if (level === settings.maxLevel - 1 && childrenToRender.length > 0) {
        const levelLimitMessage = document.createElement('div');
        levelLimitMessage.className = 'children-limit-message';
        levelLimitMessage.textContent = \`最大层级限制为\${settings.maxLevel}级，更改设置可查看更多层级\`;
        subnoteContainer.appendChild(levelLimitMessage);
      }`;

// 新的弹窗提示方式
const newCode = `      // 使用弹窗显示层级限制提示
      if (level === settings.maxLevel - 1 && childrenToRender.length > 0) {
        // 使用一个标记，防止多次显示相同提示
        if (!window.levelLimitToastShown) {
          window.levelLimitToastShown = true;
          // 使用延时确保DOM完全加载后显示
          setTimeout(() => {
            showToast(\`最大层级限制为\${settings.maxLevel}级，更改设置可查看更多层级\`, 5000);
            // 5秒后重置标记，允许下次显示
            setTimeout(() => {
              window.levelLimitToastShown = false;
            }, 5000);
          }, 300);
        }
      }`;

// 替换内容
const newContent = content.replace(oldCode, newCode);

// 写入文件
fs.writeFileSync('renderer.js', newContent, 'utf8');

console.log('层级限制提示修改完成！'); 