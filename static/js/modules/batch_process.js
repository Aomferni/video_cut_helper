// 图像批处理模块

let uploadedImagePaths = [];

// 初始化图像批处理功能
function initBatchProcessTab() {
    // 绑定事件监听器
    document.getElementById('uploadImagesBtn').addEventListener('click', uploadImages);
    document.getElementById('refreshImageListBtn').addEventListener('click', refreshImageList);
    document.getElementById('selectAllImagesBtn').addEventListener('click', selectAllImages);
    document.getElementById('deselectAllImagesBtn').addEventListener('click', deselectAllImages);
    document.getElementById('processImagesBtn').addEventListener('click', processImages);
    
    // 页面加载时刷新图像列表
    refreshImageList();
}

// 上传图像
function uploadImages() {
    const files = document.getElementById('imageFiles').files;
    if (files.length === 0) {
        alert('请选择要上传的图像文件');
        return;
    }
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }
    
    // 显示上传中提示
    document.getElementById('processResult').innerHTML = '上传中...';
    
    fetch('/upload_images', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('processResult').innerHTML = data.success;
            refreshImageList();
        } else {
            document.getElementById('processResult').innerHTML = '上传失败: ' + data.error;
        }
    })
    .catch(error => {
        document.getElementById('processResult').innerHTML = '上传过程中出现错误: ' + error.message;
    });
}

// 刷新图像列表
function refreshImageList() {
    fetch('/list_uploaded_images')
    .then(response => response.json())
    .then(data => {
        const select = document.getElementById('existingImageSelect');
        select.innerHTML = '';
        
        if (data.files && data.files.length > 0) {
            uploadedImagePaths = [];
            data.files.forEach(file => {
                const option = document.createElement('option');
                option.value = file.path;
                option.textContent = `${file.name} (${file.size})`;
                select.appendChild(option);
                uploadedImagePaths.push(file.path);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '暂无上传的图像文件';
            select.appendChild(option);
        }
    })
    .catch(error => {
        console.error('获取图像列表失败:', error);
        const select = document.getElementById('existingImageSelect');
        select.innerHTML = '<option value="">获取图像列表时出错</option>';
    });
}

// 全选图像
function selectAllImages() {
    const select = document.getElementById('existingImageSelect');
    for (let i = 0; i < select.options.length; i++) {
        select.options[i].selected = true;
    }
}

// 取消全选图像
function deselectAllImages() {
    const select = document.getElementById('existingImageSelect');
    for (let i = 0; i < select.options.length; i++) {
        select.options[i].selected = false;
    }
}

// 处理图像
function processImages() {
    // 获取选中的图像路径
    const select = document.getElementById('existingImageSelect');
    const selectedPaths = Array.from(select.selectedOptions).map(option => option.value);
    
    if (selectedPaths.length === 0) {
        alert('请选择要处理的图像文件');
        return;
    }
    
    // 获取处理参数
    const targetW = parseInt(document.getElementById('targetWidth').value) || 3508;
    const targetH = parseInt(document.getElementById('targetHeight').value) || 2480;
    const targetKB = parseInt(document.getElementById('targetSize').value) || 1000;
    
    // 显示处理中提示
    document.getElementById('processResult').innerHTML = '处理中...';
    
    // 发送处理请求
    fetch('/process_images', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image_paths: selectedPaths,
            target_w: targetW,
            target_h: targetH,
            target_kb: targetKB
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.results) {
            // 显示处理结果
            let resultHtml = '<h4>处理完成:</h4><ul>';
            let successCount = 0;
            
            data.results.forEach(result => {
                if (result.success) {
                    resultHtml += `<li>✔ ${result.input.split('/').pop()} -> ${result.output.split('/').pop()} (${result.size})</li>`;
                    successCount++;
                } else {
                    resultHtml += `<li>✘ ${result.input.split('/').pop()}: ${result.error}</li>`;
                }
            });
            
            resultHtml += `</ul><p>成功处理 ${successCount}/${data.results.length} 个文件</p>`;
            document.getElementById('processResult').innerHTML = resultHtml;
            
            // 更新输出文件列表
            updateOutputFilesList();
        } else if (data.error) {
            document.getElementById('processResult').innerHTML = '处理失败: ' + data.error;
        }
    })
    .catch(error => {
        document.getElementById('processResult').innerHTML = '处理过程中出现错误: ' + error.message;
    });
}

// 更新输出文件列表
function updateOutputFilesList() {
    fetch('/list_all_files')
    .then(response => response.json())
    .then(data => {
        const outputList = document.getElementById('outputFilesList');
        outputList.innerHTML = '';
        
        if (data.outputs && data.outputs.length > 0) {
            data.outputs.forEach(file => {
                // 只显示图像文件
                const ext = file.name.split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif', 'gif'].includes(ext)) {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <strong>${file.name}</strong> (${file.size}) 
                        <a href="/download/${file.name}" target="_blank">下载</a>
                    `;
                    outputList.appendChild(listItem);
                }
            });
        } else {
            outputList.innerHTML = '<li>暂无输出文件</li>';
        }
    })
    .catch(error => {
        console.error('获取输出文件列表失败:', error);
        document.getElementById('outputFilesList').innerHTML = '<li>获取文件列表时出错</li>';
    });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBatchProcessTab);
} else {
    // DOM已经加载完成
    initBatchProcessTab();
}

// 导出初始化函数
export { initBatchProcessTab };