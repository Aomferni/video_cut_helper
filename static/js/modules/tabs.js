// 标签页管理模块

/**
 * 初始化标签页切换功能
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有活动状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            // 设置当前按钮为活动状态
            this.classList.add('active');
            // 显示对应的内容区域
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// 导出函数供其他模块使用
export { initTabs };