// 视频拼接模块

// 全局变量
let uploadedConcatVideos = [];
let selectedCoverImage = null;

/**
 * 初始化视频拼接标签页
 */
function initConcatTab() {
    // 页面加载时刷新视频列表
    refreshVideoListForConcat();
    // 上传视频按钮
    document.getElementById('uploadConcatVideosBtn').addEventListener('click', function() {
        const fileInput = document.getElementById('concatVideoFiles');
        if (fileInput.files.length === 0) {
            alert('请先选择视频文件');
            return;
        }
        // 上传所有选择的文件
        const files = fileInput.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('video', file);
            fetch('/upload_video', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('上传失败: ' + data.error);
                } else {
                    // 添加到已上传列表
                    uploadedConcatVideos.push({
                        name: data.filename,
                        path: data.filepath
                    });
                    updateUploadedVideosList();
                    // 刷新视频列表
                    refreshVideoListForConcat();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('上传失败: ' + error);
            });
        }
    });
    // 从已上传文件中选择视频（视频拼接页面）
    document.getElementById('addSelectedVideosBtn').addEventListener('click', function() {
        const selectElement = document.getElementById('existingVideoSelectForConcat');
        const selectedOptions = Array.from(selectElement.selectedOptions);
        if (selectedOptions.length === 0) {
            alert('请先选择要添加的视频文件');
            return;
        }
        selectedOptions.forEach(option => {
            const filePath = option.value;
            const fileName = option.textContent.split(' (')[0]; // 提取文件名部分
            // 检查是否已添加
            const alreadyAdded = uploadedConcatVideos.some(video => video.path === filePath);
            if (!alreadyAdded) {
                // 添加到已上传列表
                uploadedConcatVideos.push({
                    name: fileName,
                    path: filePath
                });
            }
        });
        updateUploadedVideosList();
    });
    // 刷新视频列表按钮（视频拼接页面）
    document.getElementById('refreshVideoListForConcatBtn').addEventListener('click', function() {
        refreshVideoListForConcat();
    });
    // 开始拼接按钮
    document.getElementById('concatButton').addEventListener('click', function() {
        concatVideos();
    });
    
    // 上传封面图片按钮
    document.getElementById('uploadCoverImageBtn').addEventListener('click', function() {
        uploadCoverImage();
    });
    
    // 应用封面按钮
    document.getElementById('setCoverButton').addEventListener('click', function() {
        setVideoCover();
    });
    
    // 初始化输出文件列表
    updateOutputFilesList();
}

/**
 * 刷新视频列表（视频拼接页面）
 */
function refreshVideoListForConcat() {
    // 获取上传的视频文件
    fetch('/list_upload_videos')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('existingVideoSelectForConcat');
        // 保留默认选项
        const defaultOption = selectElement.options[0];
        selectElement.innerHTML = '';
        selectElement.appendChild(defaultOption);
        // 添加视频文件选项
        data.files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.path;
            option.textContent = `${file.name} (${file.size})`;
            selectElement.appendChild(option);
        });
        
        // 同时更新设置封面的视频选择下拉框
        updateVideoSelectForCover(data.files);
    })
    .catch(error => {
        console.error('Error:', error);
    });
    
    // 获取输出文件并添加到设置封面的视频选择下拉框
    fetch('/list_output_files')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('selectVideoForCover');
        // 保留默认选项
        const defaultOption = selectElement.options[0];
        selectElement.innerHTML = '';
        selectElement.appendChild(defaultOption);
        // 添加输出文件选项
        data.files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.path;
            option.textContent = `${file.name} (${file.size})`;
            selectElement.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * 更新设置封面的视频选择下拉框
 */
function updateVideoSelectForCover(uploadFiles) {
    const selectElement = document.getElementById('selectVideoForCover');
    // 保留默认选项
    const defaultOption = selectElement.options[0];
    selectElement.innerHTML = '';
    selectElement.appendChild(defaultOption);
    
    // 添加上传文件选项
    uploadFiles.forEach(file => {
        const option = document.createElement('option');
        option.value = file.path;
        option.textContent = `${file.name} (${file.size})`;
        selectElement.appendChild(option);
    });
    
    // 获取输出文件并添加到下拉框
    fetch('/list_output_files')
    .then(response => response.json())
    .then(data => {
        // 添加输出文件选项
        data.files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.path;
            option.textContent = `${file.name} (${file.size})`;
            selectElement.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * 更新已上传视频列表
 */
function updateUploadedVideosList() {
    const listElement = document.getElementById('uploadedVideosList');
    listElement.innerHTML = '';
    uploadedConcatVideos.forEach((video, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'sortable-item';
        listItem.draggable = true;
        listItem.dataset.index = index;
        listItem.innerHTML = `
            <div class="sortable-handle">☰</div>
            <span>${video.name}</span>
            <button class="remove-btn" data-index="${index}">移除</button>
        `;
        listElement.appendChild(listItem);
    });
    // 为移除按钮添加事件监听器
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            uploadedConcatVideos.splice(index, 1);
            updateUploadedVideosList();
        });
    });
    // 添加拖拽事件监听器
    initDragAndDrop();
}

/**
 * 初始化拖拽功能
 */
function initDragAndDrop() {
    const listElement = document.getElementById('uploadedVideosList');
    const sortableItems = listElement.querySelectorAll('.sortable-item');
    let draggedItem = null;
    sortableItems.forEach(item => {
        // 拖拽开始
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            setTimeout(() => {
                this.classList.add('dragging');
            }, 0);
        });
        // 拖拽结束
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedItem = null;
            // 更新数组顺序
            updateVideoOrder();
        });
        // 拖拽进入
        item.addEventListener('dragenter', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        // 拖拽经过
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        // 拖拽离开
        item.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        // 拖拽放置
        item.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            if (draggedItem !== this) {
                const allItems = [...listElement.querySelectorAll('.sortable-item')];
                const thisIndex = allItems.indexOf(this);
                const draggedIndex = allItems.indexOf(draggedItem);
                if (thisIndex < draggedIndex) {
                    listElement.insertBefore(draggedItem, this);
                } else {
                    listElement.insertBefore(draggedItem, this.nextSibling);
                }
            }
        });
    });
}

/**
 * 更新视频顺序
 */
function updateVideoOrder() {
    const listElement = document.getElementById('uploadedVideosList');
    const items = listElement.querySelectorAll('.sortable-item');
    const newOrder = [];
    items.forEach(item => {
        const index = parseInt(item.dataset.index);
        newOrder.push(uploadedConcatVideos[index]);
    });
    uploadedConcatVideos = newOrder;
}

/**
 * 视频拼接功能
 */
function concatVideos() {
    const resultBox = document.getElementById('concatResult');
    const outputFileName = document.getElementById('outputFileName').value || '拼接结果.mp4';
    // 检查是否已上传视频
    if (uploadedConcatVideos.length === 0) {
        alert('请先上传视频文件');
        return;
    }
    resultBox.textContent = "正在处理视频拼接...";
    // 准备要发送的数据
    const videoPaths = uploadedConcatVideos.map(video => video.path);
    const requestData = {
        video_paths: videoPaths,
        output_filename: outputFileName
    };
    // 发送拼接请求
    fetch('/concat_videos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultBox.textContent = '处理失败: ' + data.error;
        } else {
            resultBox.textContent = '视频拼接完成: ' + data.output_file;
            // 更新输出文件列表
            updateOutputFilesList();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        resultBox.textContent = '处理失败: ' + error;
    });
}

/**
 * 上传封面图片
 */
function uploadCoverImage() {
    const fileInput = document.getElementById('coverImageFile');
    if (fileInput.files.length === 0) {
        alert('请先选择封面图片文件');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('video', file);  // 使用相同的接口上传图片
    
    fetch('/upload_video', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('上传失败: ' + data.error);
        } else {
            selectedCoverImage = data.filepath;
            alert('封面图片上传成功');
            // 刷新视频列表以包含新上传的图片
            refreshVideoListForConcat();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('上传失败: ' + error);
    });
}

/**
 * 设置视频封面
 */
function setVideoCover() {
    const selectElement = document.getElementById('selectVideoForCover');
    const videoPath = selectElement.value;
    
    if (!videoPath) {
        alert('请先选择要设置封面的视频文件');
        return;
    }
    
    if (!selectedCoverImage) {
        alert('请先上传封面图片');
        return;
    }
    
    const resultBox = document.getElementById('concatResult');
    resultBox.textContent = "正在设置视频封面...";
    
    // 准备要发送的数据
    const requestData = {
        video_path: videoPath,
        cover_path: selectedCoverImage
    };
    
    // 发送设置封面请求
    fetch('/set_video_cover', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultBox.textContent = '处理失败: ' + data.error;
        } else {
            resultBox.textContent = '视频封面设置完成: ' + data.output_filename;
            // 更新输出文件列表
            updateOutputFilesList();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        resultBox.textContent = '处理失败: ' + error;
    });
}

/**
 * 更新输出文件列表
 */
function updateOutputFilesList() {
    fetch('/list_output_files')
    .then(response => response.json())
    .then(data => {
        const listElement = document.getElementById('outputFilesList');
        listElement.innerHTML = '';
        data.files.forEach(file => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${file.name} (${file.size})</span>
                <a href="/download/${file.name}" target="_blank">下载</a>
            `;
            listElement.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// 导出函数供其他模块使用
export {
    initConcatTab,
    refreshVideoListForConcat,
    updateUploadedVideosList,
    initDragAndDrop,
    updateVideoOrder,
    concatVideos,
    updateOutputFilesList
};