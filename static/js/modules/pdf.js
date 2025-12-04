// PDF转图片功能模块

// 全局变量
let uploadedPdfPath = null;

// 初始化PDF功能
function initPdfTab() {
    // 绑定事件监听器
    document.getElementById('uploadPdfBtn').addEventListener('click', uploadPdf);
    document.getElementById('refreshPdfListBtn').addEventListener('click', refreshPdfList);
    document.getElementById('convertPdfBtn').addEventListener('click', convertPdf);
    
    // 初始刷新PDF列表
    refreshPdfList();
}

// 上传PDF文件
function uploadPdf() {
    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('请先选择一个PDF文件');
        return;
    }
    
    const formData = new FormData();
    formData.append('pdf', file);
    
    // 显示上传进度
    const progressContainer = document.getElementById('pdfUploadProgressContainer');
    const progressBar = document.getElementById('pdfUploadProgress');
    const progressText = document.getElementById('pdfUploadProgressText');
    progressContainer.style.display = 'block';
    progressBar.value = 0;
    progressText.textContent = '0%';
    
    // 创建XMLHttpRequest以跟踪上传进度
    const xhr = new XMLHttpRequest();
    
    // 上传进度事件
    xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            progressBar.value = percentComplete;
            progressText.textContent = Math.round(percentComplete) + '%';
        }
    });
    
    // 上传完成事件
    xhr.addEventListener('load', function() {
        progressContainer.style.display = 'none';
        
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
                uploadedPdfPath = response.filepath;
                document.getElementById('pdfResult').innerHTML = `<span style="color: green;">✅ ${response.success}</span>`;
                refreshPdfList();
            } else {
                document.getElementById('pdfResult').innerHTML = `<span style="color: red;">❌ ${response.error}</span>`;
            }
        } else {
            document.getElementById('pdfResult').innerHTML = `<span style="color: red;">❌ 上传失败</span>`;
        }
    });
    
    // 上传错误事件
    xhr.addEventListener('error', function() {
        progressContainer.style.display = 'none';
        document.getElementById('pdfResult').innerHTML = `<span style="color: red;">❌ 上传过程中出现错误</span>`;
    });
    
    xhr.open('POST', '/upload_pdf', true);
    xhr.send(formData);
}

// 刷新PDF文件列表
function refreshPdfList() {
    fetch('/list_pdf_files')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('existingPdfSelect');
            select.innerHTML = '<option value="">请选择已上传的PDF文件</option>';
            
            if (data.files && data.files.length > 0) {
                data.files.forEach(file => {
                    const option = document.createElement('option');
                    option.value = file.path;
                    option.textContent = `${file.name} (${file.size})`;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('获取PDF文件列表失败:', error);
        });
}

// 转换PDF为图片
function convertPdf() {
    // 获取当前选择的PDF文件
    let pdfPath = uploadedPdfPath;
    if (!pdfPath) {
        pdfPath = document.getElementById('existingPdfSelect').value;
    }
    
    if (!pdfPath) {
        alert('请先上传PDF文件或选择一个已上传的PDF文件');
        return;
    }
    
    // 获取DPI和格式设置
    const dpi = document.getElementById('pdfDpi').value || 150;
    const format = document.getElementById('pdfFormat').value || 'jpg';
    
    // 显示处理中消息
    document.getElementById('pdfResult').innerHTML = '🔄 正在转换PDF文件，请稍候...';
    
    // 发送转换请求
    fetch('/convert_pdf_to_images', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            pdf_path: pdfPath,
            dpi: parseInt(dpi),
            format: format
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('pdfResult').innerHTML = `<span style="color: green;">✅ ${data.success}</span>`;
            
            // 显示转换后的图片
            const imagesContainer = document.getElementById('pdfOutputImages');
            imagesContainer.innerHTML = '';
            
            if (data.image_paths && data.image_paths.length > 0) {
                data.image_paths.forEach(imagePath => {
                    const imgContainer = document.createElement('div');
                    imgContainer.style.textAlign = 'center';
                    imgContainer.style.width = '200px';
                    
                    const img = document.createElement('img');
                    img.src = `/${imagePath}`;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.border = '1px solid #ddd';
                    img.style.borderRadius = '4px';
                    img.style.marginBottom = '5px';
                    
                    const label = document.createElement('div');
                    label.textContent = imagePath.split('/').pop();
                    label.style.fontSize = '12px';
                    label.style.wordBreak = 'break-all';
                    
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(label);
                    imagesContainer.appendChild(imgContainer);
                });
            }
        } else {
            document.getElementById('pdfResult').innerHTML = `<span style="color: red;">❌ ${data.error}</span>`;
        }
    })
    .catch(error => {
        console.error('转换PDF失败:', error);
        document.getElementById('pdfResult').innerHTML = `<span style="color: red;">❌ 转换过程中出现错误</span>`;
    });
}

// 导出初始化函数
export { initPdfTab };