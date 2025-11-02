// 全局变量
let activeCell = null;
let videoElement = null;
let uploadedVideoPath = null;
let uploadedExcelData = null;
let uploadedConcatVideos = [];
let uploadedCompressVideoPath = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化标签页
    initTabs();
    
    // 初始化视频剪辑功能
    initCuttingTab();
    
    // 初始化视频播放器功能
    initPlayerTab();
    
    // 初始化视频拼接功能
    initConcatTab();
    
    // 初始化视频压缩功能
    initCompressTab();
    
    // 定期更新输出文件列表
    setInterval(function() {
        updateOutputFilesList();
        updateCutOutputFilesList();
        updateCompressOutputFilesList();
    }, 5000);
    
    // 添加点击表格外取消激活状态的事件监听器
    document.addEventListener('click', function(event) {
        // 检查点击是否在表格内部
        const isInClipTable = event.target.closest('#clipTable');
        const isInRecordTable = event.target.closest('#player table');
        
        // 如果点击不在表格内部，则取消激活状态
        if (!isInClipTable && !isInRecordTable) {
            // 移除之前激活单元格的高亮
            if (activeCell) {
                activeCell.classList.remove('active-cell');
                activeCell = null;
            }
        }
    });
});

// 初始化标签页切换功能
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

// 初始化视频剪辑标签页
function initCuttingTab() {
    // 页面加载时刷新视频列表
    refreshVideoListForCutting();
    
    // 选择视频文件后直接播放，不需要上传
    document.getElementById('videoFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // 直接播放视频，不上传到服务器
            playUploadedVideo(file);
            
            // 清除已选择的现有文件
            document.getElementById('existingVideoSelectForCutting').value = '';
        }
    });
    
    // 从已上传文件中选择视频（视频剪辑页面）
    document.getElementById('existingVideoSelectForCutting').addEventListener('change', function(e) {
        const selectedValue = e.target.value;
        if (selectedValue) {
            // 清除文件选择
            document.getElementById('videoFile').value = '';
            
            // 设置上传路径
            uploadedVideoPath = selectedValue;
            
            // 获取文件名
            const fileName = selectedValue.split('/').pop();
            document.getElementById('cutResult').textContent = '已选择文件: ' + fileName;
            
            // 播放视频
            playVideoFromPath(selectedValue);
        }
    });
    
    // 刷新视频列表按钮（视频剪辑页面）
    document.getElementById('refreshVideoListForCuttingBtn').addEventListener('click', function() {
        refreshVideoListForCutting();
    });
    
    // 上传视频按钮
    document.getElementById('uploadVideoBtn').addEventListener('click', function() {
        const fileInput = document.getElementById('videoFile');
        if (fileInput.files.length === 0) {
            alert('请先选择视频文件');
            return;
        }
        
        // 显示上传进度条
        const progressContainer = document.getElementById('videoUploadProgressContainer');
        const progressBar = document.getElementById('videoUploadProgress');
        const progressText = document.getElementById('videoUploadProgressText');
        progressContainer.style.display = 'block';
        progressBar.value = 0;
        progressText.textContent = '0%';
        
        // 模拟上传进度（实际项目中应该通过真实的上传过程更新进度）
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 1;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.value = progress;
            progressText.textContent = progress + '%';
        }, 100);
        
        // 真实的上传逻辑（在模拟进度完成后执行）
        setTimeout(() => {
            const formData = new FormData();
            formData.append('video', fileInput.files[0]);
            
            fetch('/upload_video', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                
                if (data.error) {
                    alert('上传失败: ' + data.error);
                } else {
                    uploadedVideoPath = data.filepath;
                    document.getElementById('cutResult').textContent = '视频上传成功: ' + data.filename;
                    
                    // 刷新视频列表
                    refreshVideoListForCutting();
                }
            })
            .catch(error => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                
                console.error('Error:', error);
                alert('上传失败: ' + error);
            });
        }, 3000); // 3秒后执行真实上传
    });
    
    // 上传Excel按钮
    document.getElementById('uploadExcelBtn').addEventListener('click', function() {
        const fileInput = document.getElementById('excelFile');
        if (fileInput.files.length === 0) {
            alert('请先选择Excel文件');
            return;
        }
        
        // 显示上传进度条
        const progressContainer = document.getElementById('excelUploadProgressContainer');
        const progressBar = document.getElementById('excelUploadProgress');
        const progressText = document.getElementById('excelUploadProgressText');
        progressContainer.style.display = 'block';
        progressBar.value = 0;
        progressText.textContent = '0%';
        
        // 模拟上传进度（实际项目中应该通过真实的上传过程更新进度）
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 1;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.value = progress;
            progressText.textContent = progress + '%';
        }, 100);
        
        // 真实的上传逻辑（在模拟进度完成后执行）
        setTimeout(() => {
            const formData = new FormData();
            formData.append('excel', fileInput.files[0]);
            
            fetch('/upload_excel', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                
                if (data.error) {
                    alert('上传失败: ' + data.error);
                } else {
                    uploadedExcelData = data.data;
                    document.getElementById('cutResult').textContent = 'Excel上传成功: ' + data.filename;
                    
                    // 更新表格内容
                    updateClipTable(data.data);
                }
            })
            .catch(error => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                
                console.error('Error:', error);
                alert('上传失败: ' + error);
            });
        }, 3000); // 3秒后执行真实上传
    });
    
    // 导出Excel按钮
    document.getElementById('exportExcelBtn').addEventListener('click', function() {
        exportToExcel();
    });
    
    // 添加行按钮
    document.getElementById('addRowBtn').addEventListener('click', function() {
        const tbody = document.querySelector('#clipTable tbody');
        const newRow = tbody.insertRow();
        
        // 添加复选框单元格
        const checkboxCell = newRow.insertCell(0);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'row-checkbox';
        checkboxCell.appendChild(checkbox);
        
        const cell1 = newRow.insertCell(1);
        const cell2 = newRow.insertCell(2);
        const cell3 = newRow.insertCell(3);
        const durationCell = newRow.insertCell(4);
        const actionCell = newRow.insertCell(5);
        
        cell1.className = 'editable';
        cell1.contentEditable = true;
        cell1.textContent = '00:00:00';
        
        cell2.className = 'editable';
        cell2.contentEditable = true;
        cell2.textContent = '00:00:00';
        
        cell3.className = 'editable';
        cell3.contentEditable = true;
        cell3.textContent = '';
        
        durationCell.className = 'duration-cell';
        durationCell.textContent = '0';
        
        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-row-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', function() {
            if (confirm('确定要删除这一行吗？')) {
                tbody.removeChild(newRow);
                updateSelectAllCheckbox();
            }
        });
        actionCell.appendChild(deleteBtn);
        
        // 添加时间变化监听器以自动计算时长
        cell1.addEventListener('input', function() {
            const duration = calculateDuration(cell1.textContent, cell2.textContent);
            durationCell.textContent = duration;
        });
        
        cell2.addEventListener('input', function() {
            const duration = calculateDuration(cell1.textContent, cell2.textContent);
            durationCell.textContent = duration;
        });
        
        // 添加点击事件以激活单元格
        cell1.addEventListener('click', function() {
            setActiveCell(this);
        });
        
        cell2.addEventListener('click', function() {
            setActiveCell(this);
        });
        
        cell3.addEventListener('click', function() {
            setActiveCell(this);
        });
        
        // 添加复选框事件监听器
        checkbox.addEventListener('change', function() {
            updateSelectAllCheckbox();
        });
    });
    
    // 删除选中行按钮
    document.getElementById('deleteSelectedRowsBtn').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#clipTable tbody .row-checkbox:checked');
        if (checkboxes.length === 0) {
            alert('请先选择要删除的行');
            return;
        }
        
        if (confirm(`确定要删除选中的${checkboxes.length}行吗？`)) {
            // 从后往前删除，避免索引问题
            const rows = [];
            checkboxes.forEach(checkbox => {
                rows.push(checkbox.closest('tr'));
            });
            
            rows.forEach(row => {
                row.remove();
            });
            
            // 更新全选复选框状态
            updateSelectAllCheckbox();
        }
    });
    
    // 全选复选框
    document.getElementById('selectAllCheckbox').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#clipTable tbody .row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
    
    // 记录时间点表格全选复选框
    document.getElementById('selectRecordAllCheckbox').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.record-row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
    
    // 为现有表格单元格添加点击事件
    document.querySelectorAll('#clipTable .editable').forEach(cell => {
        cell.addEventListener('click', function() {
            setActiveCell(this);
        });
    });
    
    // 为现有的删除按钮添加事件监听器
    document.querySelectorAll('#clipTable .delete-row-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (confirm('确定要删除这一行吗？')) {
                const row = this.closest('tr');
                row.remove();
                updateSelectAllCheckbox();
            }
        });
    });
    
    // 为现有的复选框添加事件监听器
    document.querySelectorAll('#clipTable .row-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectAllCheckbox();
        });
    });
    
    // 计算时长按钮
    document.getElementById('calculateDurationBtn').addEventListener('click', function() {
        calculateAllDurations();
    });
    
    // 跳转到激活时间点播放按钮
    document.getElementById('playActiveTimeBtn').addEventListener('click', function() {
        playActiveTime();
    });
    
    // 开始剪辑按钮
    document.getElementById('cutButton').addEventListener('click', function() {
        cutVideos();
    });
    
    // 初始化视频播放器功能
    initCuttingPlayer();
    
    // 初始化输出文件列表
    updateCutOutputFilesList();
}

// 初始化视频播放器标签页
function initPlayerTab() {
    // 页面加载时刷新视频列表
    refreshVideoListForPlayer();
    
    const videoPlayer = document.getElementById('videoPlayer');
    const currentTimeDisplay = document.getElementById('currentTime');
    const durationDisplay = document.getElementById('duration');
    
    // 获取进度条元素
    const progressContainer = document.getElementById('progressContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    
    // 修改视频播放器部分，不上传视频到服务器，直接本地播放
    document.getElementById('playerVideoFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // 直接创建本地URL播放，不上传到服务器
            const url = URL.createObjectURL(file);
            videoPlayer.src = url;
            
            // 自动播放视频
            videoPlayer.play();
            
            // 显示视频信息（仅显示本地信息，不调用服务器接口）
            setTimeout(() => {
                showLocalVideoInfo(file);
            }, 100);
            
            // 清除已选择的现有文件
            document.getElementById('existingVideoSelectForPlayer').value = '';
        }
    });
    
    // 从已上传文件中选择视频（视频打标页面）
    document.getElementById('existingVideoSelectForPlayer').addEventListener('change', function(e) {
        const selectedValue = e.target.value;
        if (selectedValue) {
            // 清除文件选择
            document.getElementById('playerVideoFile').value = '';
            
            // 播放视频，指定使用视频打标页面的播放器
            playVideoFromPath(selectedValue, 'videoPlayer');
            
            // 显示视频信息
            showUploadedVideoInfo(selectedValue);
        }
    });
    
    // 刷新视频列表按钮（视频打标页面）
    document.getElementById('refreshVideoListForPlayerBtn').addEventListener('click', function() {
        refreshVideoListForPlayer();
    });
    
    // 视频时间更新
    videoPlayer.addEventListener('timeupdate', function() {
        if (videoPlayer.duration) {
            const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
            progressBarFill.style.width = percent + '%';
            
            currentTimeDisplay.textContent = secondsToHMS(videoPlayer.currentTime);
        }
    });
    
    // 视频加载元数据
    videoPlayer.addEventListener('loadedmetadata', function() {
        durationDisplay.textContent = secondsToHMS(videoPlayer.duration);
    });
    
    // 点击进度条跳转到指定位置
    progressContainer.addEventListener('click', function(e) {
        if (videoPlayer.duration) {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoPlayer.currentTime = pos * videoPlayer.duration;
        }
    });
    
    // 鼠标在进度条上移动时显示时间
    progressContainer.addEventListener('mousemove', function(e) {
        if (videoPlayer.duration) {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const hoverTime = pos * videoPlayer.duration;
            
            // 显示时间提示
            const hoverTimeDisplay = document.getElementById('hoverTimeDisplay');
            hoverTimeDisplay.textContent = secondsToHMS(hoverTime);
            
            // 设置位置
            const hoverPos = e.clientX - rect.left;
            hoverTimeDisplay.style.left = (hoverPos - 30) + 'px';
            hoverTimeDisplay.style.display = 'block';
        }
    });
    
    // 鼠标离开进度条时隐藏时间显示
    progressContainer.addEventListener('mouseleave', function() {
        const hoverTimeDisplay = document.getElementById('hoverTimeDisplay');
        hoverTimeDisplay.style.display = 'none';
    });
    
    // 播放/暂停按钮
    document.getElementById('playPauseBtn').addEventListener('click', function() {
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    });
    
    // 定位按钮
    document.getElementById('seekBtn').addEventListener('click', function() {
        const timeStr = document.getElementById('seekTime').value;
        const seconds = hmsToSeconds(timeStr);
        videoPlayer.currentTime = seconds;
    });
    
    // 为时间字段添加点击事件
    document.getElementById('startTimeField').addEventListener('click', function() {
        setActiveCell(this);
    });
    
    document.getElementById('endTimeField').addEventListener('click', function() {
        setActiveCell(this);
    });
    
    // 为时间字段添加焦点事件
    document.getElementById('startTimeField').addEventListener('focus', function() {
        setActiveCell(this);
    });
    
    document.getElementById('endTimeField').addEventListener('focus', function() {
        setActiveCell(this);
    });
    
    // 初始化记录时间点表格功能
    initRecordTimeTable();
}

// 初始化视频拼接标签页
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
    
    // 初始化输出文件列表
    updateOutputFilesList();
}

// 刷新视频列表（视频剪辑页面）
function refreshVideoListForCutting() {
    fetch('/list_upload_videos')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('existingVideoSelectForCutting');
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
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// 刷新视频列表（视频打标页面）
function refreshVideoListForPlayer() {
    fetch('/list_upload_videos')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('existingVideoSelectForPlayer');
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
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// 刷新视频列表（视频拼接页面）
function refreshVideoListForConcat() {
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
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// 从路径播放视频
function playVideoFromPath(videoPath, targetPlayerId) {
    // 获取文件名
    const fileName = videoPath.split('/').pop();
    
    // 构造视频文件的访问URL
    // 注意：这需要服务器支持文件访问
    const videoUrl = `/static/uploads/${fileName}`;
    
    // 确定要播放视频的播放器
    let videoPlayer;
    if (targetPlayerId) {
        // 如果指定了目标播放器ID，则使用指定的播放器
        videoPlayer = document.getElementById(targetPlayerId);
    } else {
        // 否则按照优先级顺序选择播放器
        videoPlayer = document.getElementById('cuttingVideoPlayer') || 
                      document.getElementById('videoPlayer') ||
                      document.getElementById('compressVideoPlayer');
    }
    
    if (videoPlayer) {
        videoPlayer.src = videoUrl;
        // 自动播放视频
        videoPlayer.play().catch(error => {
            console.log('自动播放失败:', error);
            // 如果自动播放失败，至少设置视频源
            videoPlayer.src = videoUrl;
        });
    }
}

// 播放上传的视频文件
function playUploadedVideo(file) {
    const videoPlayer = document.getElementById('cuttingVideoPlayer');
    const url = URL.createObjectURL(file);
    videoPlayer.src = url;
    videoPlayer.play();
}

// 初始化视频剪辑页面的视频播放器
function initCuttingPlayer() {
    const videoPlayer = document.getElementById('cuttingVideoPlayer');
    const currentTimeDisplay = document.getElementById('cuttingCurrentTime');
    const durationDisplay = document.getElementById('cuttingDuration');
    
    // 获取进度条元素
    const progressContainer = document.getElementById('cuttingProgressContainer');
    const progressBarFill = document.getElementById('cuttingProgressBarFill');
    
    // 视频时间更新
    videoPlayer.addEventListener('timeupdate', function() {
        if (videoPlayer.duration) {
            const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
            progressBarFill.style.width = percent + '%';
            
            currentTimeDisplay.textContent = secondsToHMS(videoPlayer.currentTime);
        }
    });
    
    // 视频加载元数据
    videoPlayer.addEventListener('loadedmetadata', function() {
        durationDisplay.textContent = secondsToHMS(videoPlayer.duration);
    });
    
    // 点击进度条跳转到指定位置
    progressContainer.addEventListener('click', function(e) {
        if (videoPlayer.duration) {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoPlayer.currentTime = pos * videoPlayer.duration;
        }
    });
    
    // 鼠标在进度条上移动时显示时间
    progressContainer.addEventListener('mousemove', function(e) {
        if (videoPlayer.duration) {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const hoverTime = pos * videoPlayer.duration;
            
            // 显示时间提示
            const hoverTimeDisplay = document.getElementById('cuttingHoverTimeDisplay');
            hoverTimeDisplay.textContent = secondsToHMS(hoverTime);
            
            // 设置位置
            const hoverPos = e.clientX - rect.left;
            hoverTimeDisplay.style.left = (hoverPos - 30) + 'px';
            hoverTimeDisplay.style.display = 'block';
        }
    });
    
    // 鼠标离开进度条时隐藏时间显示
    progressContainer.addEventListener('mouseleave', function() {
        const hoverTimeDisplay = document.getElementById('cuttingHoverTimeDisplay');
        hoverTimeDisplay.style.display = 'none';
    });
    
    // 播放/暂停按钮
    document.getElementById('cuttingPlayPauseBtn').addEventListener('click', function() {
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    });
    
    // 初始化输出文件列表
    updateCutOutputFilesList();
}

// 计算所有行的时长
function calculateAllDurations() {
    const rows = document.querySelectorAll('#clipTable tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {  // 6列：checkbox, 开始时间, 结束时间, 剪辑标题, 时长, 操作
            const startTimeCell = cells[1];
            const endTimeCell = cells[2];
            const durationCell = cells[4];
            
            const startTime = startTimeCell.textContent;
            const endTime = endTimeCell.textContent;
            
            // 计算时长
            const duration = calculateDuration(startTime, endTime);
            durationCell.textContent = duration;
        }
    });
    
    alert('所有行的时长已重新计算');
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
    const allCheckboxes = document.querySelectorAll('#clipTable tbody .row-checkbox');
    const checkedCheckboxes = document.querySelectorAll('#clipTable tbody .row-checkbox:checked');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    
    if (allCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === allCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

// 更新表格（通用函数，可处理不同表格）
function updateTable(data, tableSelector, checkboxClass, deleteBtnClass) {
    const tbody = document.querySelector(tableSelector + ' tbody');
    tbody.innerHTML = ''; // 清空现有内容
    
    data.forEach(row => {
        const newRow = tbody.insertRow();
        
        // 添加复选框单元格
        const checkboxCell = newRow.insertCell(0);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = checkboxClass;
        checkboxCell.appendChild(checkbox);
        
        // 获取列名（支持中英文）
        const startTimeKey = Object.keys(row).find(key => 
            key.toLowerCase() === '开始时间' || key.toLowerCase() === 'starttime' || key.toLowerCase() === 'start');
        const endTimeKey = Object.keys(row).find(key => 
            key.toLowerCase() === '结束时间' || key.toLowerCase() === 'endtime' || key.toLowerCase() === 'end');
        const titleKey = Object.keys(row).find(key => 
            key.toLowerCase() === '剪辑标题' || key.toLowerCase() === 'title');
        
        // 确保数据是字符串类型，并处理NaN值
        const startTime = startTimeKey ? String(row[startTimeKey] || '00:00:00') : '00:00:00';
        const endTime = endTimeKey ? String(row[endTimeKey] || '00:00:00') : '00:00:00';
        const title = titleKey ? String(row[titleKey] || '') : '';
        
        const cell1 = newRow.insertCell(1);
        const cell2 = newRow.insertCell(2);
        const cell3 = newRow.insertCell(3);
        const durationCell = newRow.insertCell(4);
        const actionCell = newRow.insertCell(5);
        
        cell1.className = 'editable';
        cell1.contentEditable = true;
        cell1.textContent = startTime;
        
        cell2.className = 'editable';
        cell2.contentEditable = true;
        cell2.textContent = endTime;
        
        cell3.className = 'editable';
        cell3.contentEditable = true;
        cell3.textContent = title;
        
        // 计算时长
        const duration = calculateDuration(formattedStartTime, formattedEndTime);
        durationCell.className = 'duration-cell';
        durationCell.textContent = isNaN(duration) ? '0' : duration;
        
        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = deleteBtnClass;
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', function() {
            if (confirm('确定要删除这一行吗？')) {
                tbody.removeChild(newRow);
                // 根据表格类型更新全选复选框状态
                if (tableSelector === '#clipTable') {
                    updateSelectAllCheckbox();
                } else {
                    updateRecordSelectAllCheckbox();
                }
            }
        });
        actionCell.appendChild(deleteBtn);
        
        // 添加时间变化监听器以自动计算时长
        cell1.addEventListener('input', function() {
            const duration = calculateDuration(cell1.textContent, cell2.textContent);
            durationCell.textContent = isNaN(duration) ? '0' : duration;
        });
        
        cell2.addEventListener('input', function() {
            const duration = calculateDuration(cell1.textContent, cell2.textContent);
            durationCell.textContent = isNaN(duration) ? '0' : duration;
        });
        
        // 添加点击事件以激活单元格
        cell1.addEventListener('click', function() {
            setActiveCell(this);
        });
        
        cell2.addEventListener('click', function() {
            setActiveCell(this);
        });
        
        cell3.addEventListener('click', function() {
            setActiveCell(this);
        });
        
        // 添加复选框事件监听器
        checkbox.addEventListener('change', function() {
            // 根据表格类型更新全选复选框状态
            if (tableSelector === '#clipTable') {
                updateSelectAllCheckbox();
            } else {
                updateRecordSelectAllCheckbox();
            }
        });
    });
    
    // 根据表格类型更新全选复选框状态
    if (tableSelector === '#clipTable') {
        updateSelectAllCheckbox();
    } else {
        updateRecordSelectAllCheckbox();
    }
}

// 更新剪辑表格（保持原函数名以确保向后兼容）
function updateClipTable(data) {
    updateTable(data, '#clipTable', 'row-checkbox', 'delete-row-btn');
}

// 使用上传的Excel数据填充记录时间点表格（修改为调用通用函数）
function fillRecordTableWithData(data) {
    updateTable(data, '#player table', 'record-row-checkbox', 'delete-record-row-btn');
}

// 初始化视频压缩标签页
function initCompressTab() {
    // 页面加载时刷新视频列表
    refreshVideoListForCompress();
    
    // 选择视频文件后直接播放，不需要上传
    document.getElementById('compressVideoFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // 直接播放视频，不上传到服务器
            playUploadedVideo(file);
            
            // 清除已选择的现有文件
            document.getElementById('existingVideoSelectForCompress').value = '';
        }
    });
    
    // 从已上传文件中选择视频（视频压缩页面）
    document.getElementById('existingVideoSelectForCompress').addEventListener('change', function(e) {
        const selectedValue = e.target.value;
        if (selectedValue) {
            // 清除文件选择
            document.getElementById('compressVideoFile').value = '';
            
            // 设置上传路径
            uploadedCompressVideoPath = selectedValue;
            
            // 获取文件名
            const fileName = selectedValue.split('/').pop();
            document.getElementById('compressResult').textContent = '已选择文件: ' + fileName;
            
            // 播放视频
            playVideoFromPath(selectedValue);
        }
    });
    
    // 刷新视频列表按钮（视频压缩页面）
    document.getElementById('refreshVideoListForCompressBtn').addEventListener('click', function() {
        refreshVideoListForCompress();
    });
    
    // 上传视频按钮
    document.getElementById('uploadCompressVideoBtn').addEventListener('click', function() {
        const fileInput = document.getElementById('compressVideoFile');
        if (fileInput.files.length === 0) {
            alert('请先选择视频文件');
            return;
        }
        
        // 显示上传进度条
        const progressContainer = document.getElementById('compressVideoUploadProgressContainer');
        const progressBar = document.getElementById('compressVideoUploadProgress');
        const progressText = document.getElementById('compressVideoUploadProgressText');
        progressContainer.style.display = 'block';
        progressBar.value = 0;
        progressText.textContent = '0%';
        
        // 模拟上传进度（实际项目中应该通过真实的上传过程更新进度）
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 1;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.value = progress;
            progressText.textContent = progress + '%';
        }, 100);
        
        // 真实的上传逻辑（在模拟进度完成后执行）
        setTimeout(() => {
            const formData = new FormData();
            formData.append('video', fileInput.files[0]);
            
            fetch('/upload_video', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                
                if (data.error) {
                    alert('上传失败: ' + data.error);
                } else {
                    uploadedCompressVideoPath = data.filepath;
                    document.getElementById('compressResult').textContent = '视频上传成功: ' + data.filename;
                    
                    // 刷新视频列表
                    refreshVideoListForCompress();
                }
            })
            .catch(error => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                
                console.error('Error:', error);
                alert('上传失败: ' + error);
            });
        }, 3000); // 3秒后执行真实上传
    });
    
    // 开始压缩按钮
    document.getElementById('compressButton').addEventListener('click', function() {
        compressVideo();
    });
    
    // 初始化视频播放器功能
    initCompressPlayer();
    
    // 初始化输出文件列表
    updateCompressOutputFilesList();
}

// 初始化视频压缩页面的视频播放器
function initCompressPlayer() {
    const videoPlayer = document.getElementById('compressVideoPlayer');
    const currentTimeDisplay = document.getElementById('compressCurrentTime');
    const durationDisplay = document.getElementById('compressDuration');
    
    // 获取进度条元素
    const progressContainer = document.getElementById('compressProgressContainer');
    const progressBarFill = document.getElementById('compressProgressBarFill');
    
    // 视频时间更新
    videoPlayer.addEventListener('timeupdate', function() {
        if (videoPlayer.duration) {
            const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
            progressBarFill.style.width = percent + '%';
            
            currentTimeDisplay.textContent = secondsToHMS(videoPlayer.currentTime);
        }
    });
    
    // 视频加载元数据
    videoPlayer.addEventListener('loadedmetadata', function() {
        durationDisplay.textContent = secondsToHMS(videoPlayer.duration);
    });
    
    // 点击进度条跳转到指定位置
    progressContainer.addEventListener('click', function(e) {
        if (videoPlayer.duration) {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoPlayer.currentTime = pos * videoPlayer.duration;
        }
    });
    
    // 鼠标在进度条上移动时显示时间
    progressContainer.addEventListener('mousemove', function(e) {
        if (videoPlayer.duration) {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const hoverTime = pos * videoPlayer.duration;
            
            // 显示时间提示
            const hoverTimeDisplay = document.getElementById('compressHoverTimeDisplay');
            hoverTimeDisplay.textContent = secondsToHMS(hoverTime);
            
            // 设置位置
            const hoverPos = e.clientX - rect.left;
            hoverTimeDisplay.style.left = (hoverPos - 30) + 'px';
            hoverTimeDisplay.style.display = 'block';
        }
    });
    
    // 鼠标离开进度条时隐藏时间显示
    progressContainer.addEventListener('mouseleave', function() {
        const hoverTimeDisplay = document.getElementById('compressHoverTimeDisplay');
        hoverTimeDisplay.style.display = 'none';
    });
    
    // 播放/暂停按钮
    document.getElementById('compressPlayPauseBtn').addEventListener('click', function() {
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    });
    
    // 初始化输出文件列表
    updateCompressOutputFilesList();
}

// 刷新视频列表（视频压缩页面）
function refreshVideoListForCompress() {
    fetch('/list_upload_videos')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('existingVideoSelectForCompress');
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
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// 更新输出文件列表
function updateOutputFilesList() {
    fetch('/list_output_files')
    .then(response => response.json())
    .then(data => {
        const outputFilesList = document.getElementById('outputFilesList');
        outputFilesList.innerHTML = ''; // 清空现有内容
        
        data.files.forEach(file => {
            const listItem = document.createElement('li');
            listItem.textContent = file;
            outputFilesList.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// 更新剪辑输出文件列表
function updateCutOutputFilesList() {
    fetch('/list_cut_output_files')
    .then(response => response.json())
    .then(data => {
        const outputFilesList = document.getElementById('cutOutputFilesList');
        outputFilesList.innerHTML = ''; // 清空现有内容
        
        data.files.forEach(file => {
            const listItem = document.createElement('li');
            listItem.textContent = file;
            outputFilesList.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// 更新压缩输出文件列表
function updateCompressOutputFilesList() {
    fetch('/list_compress_output_files')
    .then(response => response.json())
    .then(data => {
        const outputFilesList = document.getElementById('compressOutputFilesList');
        outputFilesList.innerHTML = ''; // 清空现有内容
        
        data.files.forEach(file => {
            const listItem = document.createElement('li');
            listItem.textContent = file;
            outputFilesList.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// 更新已上传视频列表
function updateUploadedVideosList() {
    const uploadedVideosList = document.getElementById('uploadedVideosList');
    uploadedVideosList.innerHTML = ''; // 清空现有内容
    
    uploadedConcatVideos.forEach(video => {
        const listItem = document.createElement('li');
        listItem.textContent = video.name;
        uploadedVideosList.appendChild(listItem);
    });
}

// 设置激活单元格
function setActiveCell(cell) {
    if (activeCell) {
        activeCell.classList.remove('active-cell');
    }
    cell.classList.add('active-cell');
    activeCell = cell;
}

// 计算时长
function calculateDuration(startTime, endTime) {
    const startSeconds = hmsToSeconds(startTime);
    const endSeconds = hmsToSeconds(endTime);
    const duration = endSeconds - startSeconds;
    return duration;
}

// 将秒数转换为HMS格式
function secondsToHMS(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 将HMS格式转换为秒数
function hmsToSeconds(hms) {
    const parts = hms.split(':').map(part => parseInt(part, 10));
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

// 跳转到激活时间点播放
function playActiveTime() {
    if (activeCell) {
        const timeStr = activeCell.textContent;
        const seconds = hmsToSeconds(timeStr);
        const videoPlayer = document.getElementById('cuttingVideoPlayer') || 
                          document.getElementById('videoPlayer') ||
                          document.getElementById('compressVideoPlayer');
        if (videoPlayer) {
            videoPlayer.currentTime = seconds;
            videoPlayer.play();
        }
    }
}

// 导出到Excel
function exportToExcel() {
    const table = document.getElementById('clipTable');
    const rows = table.querySelectorAll('tr');
    const data = [];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = [];
        cells.forEach(cell => {
            rowData.push(cell.textContent);
        });
        data.push(rowData);
    });
    
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'output.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 初始化记录时间点表格功能
function initRecordTimeTable() {
    const recordTable = document.getElementById('recordTable');
    const recordTimeField = document.getElementById('recordTimeField');
    const recordTitleField = document.getElementById('recordTitleField');
    const recordAddBtn = document.getElementById('recordAddBtn');
    const recordDeleteBtn = document.getElementById('recordDeleteBtn');
    const recordSelectAllCheckbox = document.getElementById('selectRecordAllCheckbox');
    
    // 添加记录按钮
    recordAddBtn.addEventListener('click', function() {
        const timeStr = recordTimeField.value;
        const title = recordTitleField.value;
        if (timeStr && title) {
            const newRow = recordTable.insertRow();
            const timeCell = newRow.insertCell(0);
            const titleCell = newRow.insertCell(1);
            const actionCell = newRow.insertCell(2);
            
            timeCell.textContent = timeStr;
            titleCell.textContent = title;
            
            // 添加复选框单元格
            const checkboxCell = newRow.insertCell(0);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'record-row-checkbox';
            checkboxCell.appendChild(checkbox);
            
            // 添加删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-record-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', function() {
                if (confirm('确定要删除这一行吗？')) {
                    recordTable.removeChild(newRow);
                    updateRecordSelectAllCheckbox();
                }
            });
            actionCell.appendChild(deleteBtn);
            
            // 清空输入框
            recordTimeField.value = '';
            recordTitleField.value = '';
            
            // 添加复选框事件监听器
            checkbox.addEventListener('change', function() {
                updateRecordSelectAllCheckbox();
            });
        }
    });
    
    // 删除选中行按钮
    recordDeleteBtn.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#recordTable .record-row-checkbox:checked');
        if (checkboxes.length === 0) {
            alert('请先选择要删除的行');
            return;
        }
        
        if (confirm(`确定要删除选中的${checkboxes.length}行吗？`)) {
            // 从后往前删除，避免索引问题
            const rows = [];
            checkboxes.forEach(checkbox => {
                rows.push(checkbox.closest('tr'));
            });
            
            rows.forEach(row => {
                row.remove();
            });
            
            // 更新全选复选框状态
            updateRecordSelectAllCheckbox();
        }
    });
    
    // 全选复选框
    recordSelectAllCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#recordTable .record-row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
}

// 更新记录时间点表格的全选复选框状态
function updateRecordSelectAllCheckbox() {
    const allCheckboxes = document.querySelectorAll('#recordTable .record-row-checkbox');
    const checkedCheckboxes = document.querySelectorAll('#recordTable .record-row-checkbox:checked');
    const selectAllCheckbox = document.getElementById('selectRecordAllCheckbox');
    
    if (allCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === allCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

// 显示本地视频信息（不上传到服务器）
function showLocalVideoInfo(file) {
    const video = document.getElementById('videoPlayer');
    
    // 先清空之前的信息
    document.getElementById('videoInfo').textContent = '正在加载视频信息...';
    
    // 等待视频加载元数据
    const onLoadMetadata = function() {
        const fileSize = (file.size / (1024 * 1024)).toFixed(2); // MB
        
        const infoText = `文件名: ${file.name}\n文件大小: ${fileSize} MB\n视频时长: ${secondsToHMS(video.duration)}\n分辨率: ${video.videoWidth}x${video.videoHeight}`;
        document.getElementById('videoInfo').textContent = infoText;
    };
    
    // 检查视频是否已经加载了元数据
    if (video.readyState >= 1) {
        // 如果已经加载了元数据，直接显示信息
        onLoadMetadata();
    } else {
        // 否则等待加载元数据
        video.addEventListener('loadedmetadata', onLoadMetadata);
    }
}

// 显示已上传视频信息
function showUploadedVideoInfo(videoPath) {
    // 先清空之前的信息
    document.getElementById('videoInfo').textContent = '正在加载视频信息...';
    
    // 发送请求到服务器获取视频信息
    fetch('/get_video_info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({video_path: videoPath})
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            document.getElementById('videoInfo').textContent = '获取视频信息失败: ' + data.error;
        } else {
            // 获取文件名
            const fileName = videoPath.split('/').pop();
            
            // 获取文件大小
            fetch('/get_file_size', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({file_path: videoPath})
            })
            .then(response => response.json())
            .then(sizeData => {
                const fileSize = sizeData.size ? (sizeData.size / (1024 * 1024)).toFixed(2) : '未知';
                
                const infoText = `文件名: ${fileName}
文件大小: ${fileSize} MB
视频时长: ${data.duration_str}
帧率: ${data.fps} FPS
分辨率: ${data.width}x${data.height}`;
                document.getElementById('videoInfo').textContent = infoText;
            })
            .catch(error => {
                const infoText = `文件名: ${fileName}
文件大小: 未知
视频时长: ${data.duration_str}
帧率: ${data.fps} FPS
分辨率: ${data.width}x${data.height}`;
                document.getElementById('videoInfo').textContent = infoText;
            });
        }
    })
    .catch(error => {
        document.getElementById('videoInfo').textContent = '获取视频信息失败: ' + error;
    });
}

// 初始化记录时间点表格功能
function initRecordTimeTable() {
    // 记录当前时间按钮（现在在快速定位区域）
    const recordTimeBtn = document.getElementById('recordTimeBtn');
    if (recordTimeBtn) {
        recordTimeBtn.addEventListener('click', function() {
            recordCurrentTime();
        });
    }
    
    // 添加行按钮
    document.getElementById('addRecordRowBtn').addEventListener('click', function() {
        addRecordRow();
    });
    
    // 删除选中行按钮
    document.getElementById('deleteSelectedRecordRowsBtn').addEventListener('click', function() {
        deleteSelectedRecordRows();
    });
    
    // 计算时长按钮
    document.getElementById('calculateRecordDurationBtn').addEventListener('click', function() {
        calculateAllRecordDurations();
    });
    
    // 跳转到激活时间点播放按钮
    document.getElementById('playRecordActiveTimeBtn').addEventListener('click', function() {
        playRecordActiveTime();
    });
    
    // 上传Excel按钮（修改为与视频剪辑页面相同的逻辑）
    document.getElementById('importRecordExcelBtn').addEventListener('click', function() {
        const fileInput = document.getElementById('importRecordExcelFile');
        if (fileInput.files.length === 0) {
            alert('请先选择Excel文件');
            return;
        }
        
        // 显示上传进度条
        const progressContainer = document.getElementById('recordExcelUploadProgressContainer');
        const progressBar = document.getElementById('recordExcelUploadProgress');
        const progressText = document.getElementById('recordExcelUploadProgressText');
        progressContainer.style.display = 'block';
        progressBar.value = 0;
        progressText.textContent = '0%';
        
        // 模拟上传进度（实际项目中应该通过真实的上传过程更新进度）
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 1;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.value = progress;
            progressText.textContent = progress + '%';
        }, 100);
        
        // 真实的上传逻辑（在模拟进度完成后执行）
        setTimeout(() => {
            const formData = new FormData();
            formData.append('excel', fileInput.files[0]);
            
            fetch('/upload_excel', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                
                if (data.error) {
                    alert('上传失败: ' + data.error);
                } else {
                    // 使用上传的Excel数据填充记录时间点表格
                    fillRecordTableWithData(data.data);
                    alert('Excel上传成功: ' + data.filename);
                }
            })
            .catch(error => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                
                console.error('Error:', error);
                alert('上传失败: ' + error);
            });
        }, 3000); // 3秒后执行真实上传
    });
    
    // 同步到剪辑需求表格按钮（使用HTML中已有的按钮）
    const syncToClipTableBtn = document.getElementById('syncToClipTableBtn');
    if (syncToClipTableBtn) {
        syncToClipTableBtn.addEventListener('click', function() {
            syncRecordToClipTable();
        });
    }
    
    // 导出Excel按钮（使用HTML中已有的按钮）
    const exportRecordExcelBtn = document.getElementById('exportRecordExcelBtn');
    if (exportRecordExcelBtn) {
        exportRecordExcelBtn.addEventListener('click', function() {
            exportRecordToExcel();
        });
    }
    
    // 为现有的复选框添加事件监听器
    document.querySelectorAll('.record-row-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateRecordSelectAllCheckbox();
        });
    });
    
    // 为现有的删除按钮添加事件监听器
    document.querySelectorAll('.delete-record-row-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (confirm('确定要删除这一行吗？')) {
                const row = this.closest('tr');
                row.remove();
                updateRecordSelectAllCheckbox();
            }
        });
    });
    
    // 为现有表格单元格添加点击事件
    document.querySelectorAll('#player table .editable').forEach(cell => {
        cell.addEventListener('click', function() {
            setActiveCell(this);
        });
    });
    
    // 为时间变化添加监听器以自动计算时长
    const startTimeField = document.getElementById('startTimeField');
    const endTimeField = document.getElementById('endTimeField');
    const durationCell = startTimeField.closest('tr').querySelector('.duration-cell');
    
    startTimeField.addEventListener('input', function() {
        const duration = calculateDuration(startTimeField.textContent, endTimeField.textContent);
        durationCell.textContent = duration;
    });
    
    endTimeField.addEventListener('input', function() {
        const duration = calculateDuration(startTimeField.textContent, endTimeField.textContent);
        durationCell.textContent = duration;
    });
}

// 添加记录时间点行
function addRecordRow() {
    const tbody = document.querySelector('#player table tbody');
    const newRow = tbody.insertRow();
    
    // 添加复选框单元格
    const checkboxCell = newRow.insertCell(0);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'record-row-checkbox';
    checkboxCell.appendChild(checkbox);
    
    const cell1 = newRow.insertCell(1);
    const cell2 = newRow.insertCell(2);
    const cell3 = newRow.insertCell(3);
    const durationCell = newRow.insertCell(4);
    const actionCell = newRow.insertCell(5);
    
    cell1.className = 'editable';
    cell1.contentEditable = true;
    cell1.textContent = '00:00:00';
    
    cell2.className = 'editable';
    cell2.contentEditable = true;
    cell2.textContent = '00:00:00';
    
    cell3.className = 'editable';
    cell3.contentEditable = true;
    cell3.textContent = '';
    
    durationCell.className = 'duration-cell';
    durationCell.textContent = '0';
    
    // 添加删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-record-row-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', function() {
        if (confirm('确定要删除这一行吗？')) {
            tbody.removeChild(newRow);
        }
    });
    actionCell.appendChild(deleteBtn);
    
    // 添加时间变化监听器以自动计算时长
    cell1.addEventListener('input', function() {
        const duration = calculateDuration(cell1.textContent, cell2.textContent);
        durationCell.textContent = duration;
    });
    
    cell2.addEventListener('input', function() {
        const duration = calculateDuration(cell1.textContent, cell2.textContent);
        durationCell.textContent = duration;
    });
    
    // 添加点击事件以激活单元格
    cell1.addEventListener('click', function() {
        setActiveCell(this);
    });
    
    cell2.addEventListener('click', function() {
        setActiveCell(this);
    });
    
    cell3.addEventListener('click', function() {
        setActiveCell(this);
    });
    
    // 添加复选框事件监听器
    checkbox.addEventListener('change', function() {
        updateRecordSelectAllCheckbox();
    });
}

// 删除选中记录行
function deleteSelectedRecordRows() {
    const checkboxes = document.querySelectorAll('.record-row-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('请先选择要删除的行');
        return;
    }
    
    if (confirm(`确定要删除选中的${checkboxes.length}行吗？`)) {
        // 从后往前删除，避免索引问题
        const rows = [];
        checkboxes.forEach(checkbox => {
            rows.push(checkbox.closest('tr'));
        });
        
        rows.forEach(row => {
            row.remove();
        });
        
        // 更新全选复选框状态
        updateRecordSelectAllCheckbox();
    }
}

// 更新记录时间点表格全选复选框状态
function updateRecordSelectAllCheckbox() {
    const allCheckboxes = document.querySelectorAll('.record-row-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.record-row-checkbox:checked');
    const selectAllCheckbox = document.getElementById('selectRecordAllCheckbox');
    
    if (allCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === allCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

// 计算所有记录行的时长
function calculateAllRecordDurations() {
    const rows = document.querySelectorAll('#player table tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {  // 6列：checkbox, 开始时间, 结束时间, 剪辑标题, 时长, 操作
            const startTimeCell = cells[1];
            const endTimeCell = cells[2];
            const durationCell = cells[4];
            
            const startTime = startTimeCell.textContent;
            const endTime = endTimeCell.textContent;
            
            // 计算时长
            const duration = calculateDuration(startTime, endTime);
            durationCell.textContent = duration;
        }
    });
    
    alert('所有行的时长已重新计算');
}

// 记录当前时间到激活单元格
function recordCurrentTime() {
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (!videoPlayer.src) {
        alert('请先选择视频文件！');
        return;
    }
    
    if (!activeCell) {
        alert('请先点击选择要记录时间的单元格（开始时间或结束时间）！');
        return;
    }
    
    const currentTime = videoPlayer.currentTime;
    const timeStr = secondsToHMS(currentTime);
    activeCell.textContent = timeStr;
    
    // 如果是时间单元格，自动计算时长
    const row = activeCell.closest('tr');
    if (row) {
        const startTimeCell = row.cells[1];
        const endTimeCell = row.cells[2];
        const durationCell = row.cells[4];
        
        if (startTimeCell && endTimeCell && durationCell) {
            const duration = calculateDuration(startTimeCell.textContent, endTimeCell.textContent);
            durationCell.textContent = duration;
        }
    }
}

// 初始化视频拼接标签页
function initConcatTab() {
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
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('上传失败: ' + error);
            });
        }
    });
    
    // 开始拼接按钮
    document.getElementById('concatButton').addEventListener('click', function() {
        concatVideos();
    });
    
    // 初始化输出文件列表
    updateOutputFilesList();
}

// 更新已上传视频列表
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

// 初始化拖拽功能
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

// 更新视频顺序
function updateVideoOrder() {
    const listElement = document.getElementById('uploadedVideosList');
    const items = listElement.querySelectorAll('.sortable-item');
    
    const newOrder = [];
    items.forEach(item => {
        const index = parseInt(item.dataset.index);
        newOrder.push(uploadedConcatVideos[index]);
    });
    
    uploadedConcatVideos = newOrder;
    updateUploadedVideosList();
}

// 更新输出文件列表
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

// 设置活动单元格
function setActiveCell(cell) {
    // 移除之前激活单元格的高亮
    if (activeCell) {
        activeCell.classList.remove('active-cell');
    }
    
    // 设置新的激活单元格
    activeCell = cell;
    if (activeCell) {
        activeCell.classList.add('active-cell');
    }
}

// 将秒数转换为 HH:MM:SS 格式
function secondsToHMS(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

// 将HH:MM:SS格式转换为秒数
function hmsToSeconds(str) {
    // 确保输入是字符串
    const timeStr = String(str || '').trim();
    
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    let seconds = 0;
    
    if (parts.length === 3) {
        // HH:MM:SS 格式
        seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
        // MM:SS 格式
        seconds = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    } else if (parts.length === 1) {
        // SS 格式
        seconds = parseFloat(parts[0]);
    }
    
    return isNaN(seconds) ? 0 : seconds;
}

// 计算时长（以0.5分钟为步数）
function calculateDuration(startTimeStr, endTimeStr) {
    const startSeconds = hmsToSeconds(startTimeStr);
    const endSeconds = hmsToSeconds(endTimeStr);
    
    if (startSeconds >= endSeconds) return 0;
    
    const durationMinutes = (endSeconds - startSeconds) / 60;
    // 以0.5分钟为步数进行四舍五入
    return Math.round(durationMinutes * 2) / 2;
}

// 显示视频信息
function showVideoInfo(file) {
    const video = document.getElementById('videoPlayer');
    
    // 等待视频加载元数据
    video.addEventListener('loadedmetadata', function() {
        const fileSize = (file.size / (1024 * 1024)).toFixed(2); // MB
        
        const infoText = `文件名: ${file.name}
文件大小: ${fileSize} MB
视频时长: ${secondsToHMS(video.duration)}
分辨率: ${video.videoWidth}x${video.videoHeight}`;
        document.getElementById('videoInfo').textContent = infoText;
        
        // 获取服务器端视频信息
        const formData = new FormData();
        formData.append('video', file);
        
        fetch('/upload_video', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (!data.error) {
                return fetch('/get_video_info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({video_path: data.filepath})
                });
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data && !data.error) {
                const infoText = `文件名: ${file.name}
文件大小: ${fileSize} MB
视频时长: ${data.duration_str}
帧率: ${data.fps} FPS
分辨率: ${data.width}x${data.height}`;
                document.getElementById('videoInfo').textContent = infoText;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }, { once: true }); // 只执行一次
}

// 导出表格数据为Excel文件
function exportToExcel() {
    // 获取表格数据
    const tableData = [];
    const rows = document.querySelectorAll('#clipTable tbody tr');
    
    // 添加表头
    tableData.push(['开始时间', '结束时间', '剪辑标题', '时长(分钟)']);
    
    // 添加数据行
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {  // 现在有6列：checkbox, 开始时间, 结束时间, 剪辑标题, 时长, 操作
            tableData.push([
                cells[1].textContent,
                cells[2].textContent,
                cells[3].textContent,
                cells[4].textContent
            ]);
        }
    });
    
    // 发送到后端生成Excel文件
    fetch('/export_excel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            table_data: tableData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 下载生成的文件
            window.open('/download/' + data.filename, '_blank');
            alert('剪辑需求Excel文件已生成并开始下载');
        } else {
            alert('导出失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('导出失败: ' + error);
    });
}

// 视频剪辑功能
function cutVideos() {
    const resultBox = document.getElementById('cutResult');
    
    // 检查是否已上传视频
    if (!uploadedVideoPath) {
        alert('请先上传视频文件');
        return;
    }
    
    // 获取表格数据
    const tableData = [];
    const rows = document.querySelectorAll('#clipTable tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {  // 现在有6列：checkbox, 开始时间, 结束时间, 剪辑标题, 时长, 操作
            tableData.push({
                "开始时间": cells[1].textContent,
                "结束时间": cells[2].textContent,
                "剪辑标题": cells[3].textContent
            });
        }
    });
    
    // 如果有上传的Excel数据，使用Excel数据
    const dataToSend = uploadedExcelData || tableData;
    
    if (dataToSend.length === 0) {
        alert('请填写剪辑需求数据');
        return;
    }
    
    resultBox.textContent = "正在处理视频剪辑...";
    
    // 发送请求到服务器
    fetch('/cut_videos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            video_path: uploadedVideoPath,
            excel_data: dataToSend
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultBox.textContent = '处理失败: ' + data.error;
        } else {
            resultBox.textContent = data.result;
            // 更新输出文件列表
            updateCutOutputFilesList();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        resultBox.textContent = '处理失败: ' + error;
    });
}

// 视频拼接功能
function concatVideos() {
    const resultBox = document.getElementById('concatResult');
    const outputFileName = document.getElementById('outputFileName').value || '拼接结果.mp4';
    
    // 检查是否已上传视频
    if (uploadedConcatVideos.length === 0) {
        alert('请先上传视频文件');
        return;
    }
    
    resultBox.textContent = "正在处理视频拼接...";
    
    // 提取视频路径
    const videoPaths = uploadedConcatVideos.map(video => video.path);
    
    // 发送请求到服务器
    fetch('/concat_videos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            video_paths: videoPaths,
            output_name: outputFileName
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultBox.textContent = '处理失败: ' + data.error;
        } else {
            resultBox.textContent = data.result;
            // 更新输出文件列表
            updateOutputFilesList();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        resultBox.textContent = '处理失败: ' + error;
    });
}

// 更新表格（通用函数，可处理不同表格）
function updateTable(data, tableSelector, checkboxClass, deleteBtnClass) {
    const tbody = document.querySelector(tableSelector + ' tbody');
    tbody.innerHTML = ''; // 清空现有内容
    
    data.forEach(row => {
        const newRow = tbody.insertRow();
        
        // 添加复选框单元格
        const checkboxCell = newRow.insertCell(0);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = checkboxClass;
        checkboxCell.appendChild(checkbox);
        
        // 获取列名（支持中英文）
        const startTimeKey = Object.keys(row).find(key => 
            key.toLowerCase() === '开始时间' || key.toLowerCase() === 'starttime' || key.toLowerCase() === 'start');
        const endTimeKey = Object.keys(row).find(key => 
            key.toLowerCase() === '结束时间' || key.toLowerCase() === 'endtime' || key.toLowerCase() === 'end');
        const titleKey = Object.keys(row).find(key => 
            key.toLowerCase() === '剪辑标题' || key.toLowerCase() === 'title');
        
        // 确保数据是字符串类型
        const startTime = startTimeKey ? String(row[startTimeKey] || '00:00:00') : '00:00:00';
        const endTime = endTimeKey ? String(row[endTimeKey] || '00:00:00') : '00:00:00';
        const title = titleKey ? String(row[titleKey] || '') : '';
        
        const cell1 = newRow.insertCell(1);
        const cell2 = newRow.insertCell(2);
        const cell3 = newRow.insertCell(3);
        const durationCell = newRow.insertCell(4);
        const actionCell = newRow.insertCell(5);
        
        cell1.className = 'editable';
        cell1.contentEditable = true;
        cell1.textContent = startTime;
        
        cell2.className = 'editable';
        cell2.contentEditable = true;
        cell2.textContent = endTime;
        
        cell3.className = 'editable';
        cell3.contentEditable = true;
        cell3.textContent = title;
        
        // 计算时长
        const duration = calculateDuration(startTime, endTime);
        durationCell.className = 'duration-cell';
        durationCell.textContent = duration;
        
        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = deleteBtnClass;
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', function() {
            if (confirm('确定要删除这一行吗？')) {
                tbody.removeChild(newRow);
                // 根据表格类型更新全选复选框状态
                if (tableSelector === '#clipTable') {
                    updateSelectAllCheckbox();
                } else {
                    updateRecordSelectAllCheckbox();
                }
            }
        });
        actionCell.appendChild(deleteBtn);
        
        // 添加时间变化监听器以自动计算时长
        cell1.addEventListener('input', function() {
            const duration = calculateDuration(cell1.textContent, cell2.textContent);
            durationCell.textContent = duration;
        });
        
        cell2.addEventListener('input', function() {
            const duration = calculateDuration(cell1.textContent, cell2.textContent);
            durationCell.textContent = duration;
        });
        
        // 添加点击事件以激活单元格
        cell1.addEventListener('click', function() {
            setActiveCell(this);
        });
        
        cell2.addEventListener('click', function() {
            setActiveCell(this);
        });
        
        cell3.addEventListener('click', function() {
            setActiveCell(this);
        });
        
        // 添加复选框事件监听器
        checkbox.addEventListener('change', function() {
            // 根据表格类型更新全选复选框状态
            if (tableSelector === '#clipTable') {
                updateSelectAllCheckbox();
            } else {
                updateRecordSelectAllCheckbox();
            }
        });
    });
    
    // 根据表格类型更新全选复选框状态
    if (tableSelector === '#clipTable') {
        updateSelectAllCheckbox();
    } else {
        updateRecordSelectAllCheckbox();
    }
}

// 同步记录时间点表格到剪辑需求表格
function syncRecordToClipTable() {
    // 获取记录时间点表格的所有数据行
    const recordRows = document.querySelectorAll('#player table tbody tr');
    
    if (recordRows.length === 0) {
        alert('记录时间点表格中没有数据');
        return;
    }
    
    // 获取剪辑需求表格的tbody
    const clipTableBody = document.querySelector('#clipTable tbody');
    
    // 遍历记录时间点表格的每一行
    recordRows.forEach(recordRow => {
        const cells = recordRow.querySelectorAll('td');
        if (cells.length >= 6) {
            // 获取记录时间点表格的数据
            const startTime = cells[1].textContent;
            const endTime = cells[2].textContent;
            const title = cells[3].textContent;
            
            // 检查是否已经有相同的行（避免重复同步）
            let isDuplicate = false;
            const existingRows = clipTableBody.querySelectorAll('tr');
            existingRows.forEach(existingRow => {
                const existingCells = existingRow.querySelectorAll('td');
                if (existingCells.length >= 6) {
                    const existingStartTime = existingCells[1].textContent;
                    const existingEndTime = existingCells[2].textContent;
                    const existingTitle = existingCells[3].textContent;
                    
                    if (existingStartTime === startTime && existingEndTime === endTime && existingTitle === title) {
                        isDuplicate = true;
                    }
                }
            });
            
            // 如果不是重复行，则添加到剪辑需求表格
            if (!isDuplicate) {
                const newRow = clipTableBody.insertRow();
                
                // 添加复选框单元格
                const checkboxCell = newRow.insertCell(0);
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'row-checkbox';
                checkboxCell.appendChild(checkbox);
                
                const cell1 = newRow.insertCell(1);
                const cell2 = newRow.insertCell(2);
                const cell3 = newRow.insertCell(3);
                const durationCell = newRow.insertCell(4);
                const actionCell = newRow.insertCell(5);
                
                cell1.className = 'editable';
                cell1.contentEditable = true;
                cell1.textContent = startTime;
                
                cell2.className = 'editable';
                cell2.contentEditable = true;
                cell2.textContent = endTime;
                
                cell3.className = 'editable';
                cell3.contentEditable = true;
                cell3.textContent = title;
                
                // 计算时长
                const duration = calculateDuration(startTime, endTime);
                durationCell.className = 'duration-cell';
                durationCell.textContent = duration;
                
                // 添加删除按钮
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-row-btn';
                deleteBtn.textContent = '删除';
                deleteBtn.addEventListener('click', function() {
                    if (confirm('确定要删除这一行吗？')) {
                        clipTableBody.removeChild(newRow);
                        updateSelectAllCheckbox();
                    }
                });
                actionCell.appendChild(deleteBtn);
                
                // 添加时间变化监听器以自动计算时长
                cell1.addEventListener('input', function() {
                    const duration = calculateDuration(cell1.textContent, cell2.textContent);
                    durationCell.textContent = duration;
                });
                
                cell2.addEventListener('input', function() {
                    const duration = calculateDuration(cell1.textContent, cell2.textContent);
                    durationCell.textContent = duration;
                });
                
                // 添加点击事件以激活单元格
                cell1.addEventListener('click', function() {
                    setActiveCell(this);
                });
                
                cell2.addEventListener('click', function() {
                    setActiveCell(this);
                });
                
                cell3.addEventListener('click', function() {
                    setActiveCell(this);
                });
                
                // 添加复选框事件监听器
                checkbox.addEventListener('change', function() {
                    updateSelectAllCheckbox();
                });
            }
        }
    });
    
    alert('已将记录时间点同步到剪辑需求表格');
}

// 导出记录时间点表格为Excel文件
function exportRecordToExcel() {
    // 获取记录时间点表格数据
    const tableData = [];
    const rows = document.querySelectorAll('#player table tbody tr');
    
    // 添加表头
    tableData.push(['开始时间', '结束时间', '剪辑标题', '时长(分钟)']);
    
    // 添加数据行
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {  // 6列：checkbox, 开始时间, 结束时间, 剪辑标题, 时长, 操作
            tableData.push([
                cells[1].textContent,
                cells[2].textContent,
                cells[3].textContent,
                cells[4].textContent
            ]);
        }
    });
    
    // 发送到后端生成Excel文件
    fetch('/export_excel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            table_data: tableData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 下载生成的文件
            window.open('/download/' + data.filename, '_blank');
            alert('记录时间点Excel文件已生成并开始下载');
        } else {
            alert('导出失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('导出失败: ' + error);
    });
}

// 更新视频剪辑输出文件列表
function updateCutOutputFilesList() {
    fetch('/list_output_files')
    .then(response => response.json())
    .then(data => {
        const listElement = document.getElementById('cutOutputFilesList');
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

// 跳转到激活时间点播放（视频剪辑页面）
function playActiveTime() {
    if (!activeCell) {
        alert('请先点击激活一个时间单元格（开始时间或结束时间）');
        return;
    }
    
    // 获取激活单元格的时间值
    const timeStr = activeCell.textContent;
    const seconds = hmsToSeconds(timeStr);
    
    // 获取视频播放器并跳转到指定时间
    const videoPlayer = document.getElementById('cuttingVideoPlayer');
    if (videoPlayer && videoPlayer.duration) {
        videoPlayer.currentTime = seconds;
        // 如果视频暂停则播放
        if (videoPlayer.paused) {
            videoPlayer.play();
        }
    } else {
        alert('请先上传并播放视频');
    }
}

// 跳转到激活时间点播放（视频打标页面）
function playRecordActiveTime() {
    if (!activeCell) {
        alert('请先点击激活一个时间单元格（开始时间或结束时间）');
        return;
    }
    
    // 获取激活单元格的时间值
    const timeStr = activeCell.textContent;
    const seconds = hmsToSeconds(timeStr);
    
    // 获取视频播放器并跳转到指定时间
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer && videoPlayer.duration) {
        videoPlayer.currentTime = seconds;
        // 如果视频暂停则播放
        if (videoPlayer.paused) {
            videoPlayer.play();
        }
    } else {
        alert('请先选择并播放视频');
    }
}

// 导入记录时间点Excel文件
function importRecordExcel() {
    const fileInput = document.getElementById('importRecordExcelFile');
    if (fileInput.files.length === 0) {
        alert('请先选择Excel文件');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('excel', file);
    
    // 使用FileReader读取文件内容
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // 使用SheetJS解析Excel文件
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 将工作表转换为JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // 清空现有表格数据
            const tbody = document.querySelector('#player table tbody');
            tbody.innerHTML = '';
            
            // 填充表格数据
            jsonData.forEach(row => {
                addRecordRowWithData(row);
            });
            
            alert('Excel文件导入成功');
        } catch (error) {
            console.error('Error:', error);
            alert('导入失败: ' + error.message);
        }
    };
    
    reader.onerror = function() {
        alert('文件读取失败');
    };
    
    reader.readAsArrayBuffer(file);
}

// // 使用上传的Excel数据填充记录时间点表格
// function fillRecordTableWithData(data) {
//     if (!data || !Array.isArray(data)) {
//         console.error('Invalid data format');
//         return;
//     }
    
//     // 清空现有表格数据
//     const tbody = document.querySelector('#player table tbody');
//     tbody.innerHTML = '';
    
//     // 填充表格数据
//     data.forEach(row => {
//         addRecordRowWithData(row);
//     });
// }

// 添加带数据的记录行
function addRecordRowWithData(data) {
    const tbody = document.querySelector('#player table tbody');
    const newRow = tbody.insertRow();
    
    // 添加复选框单元格
    const checkboxCell = newRow.insertCell(0);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'record-row-checkbox';
    checkboxCell.appendChild(checkbox);
    
    // 获取数据中的开始时间、结束时间、剪辑标题
    // 支持多种列名格式，并确保转换为字符串
    const startTime = String(data['开始时间'] || data['StartTime'] || data['Start'] || '00:00:00');
    const endTime = String(data['结束时间'] || data['EndTime'] || data['End'] || '00:00:00');
    const title = String(data['剪辑标题'] || data['Title'] || '');
    
    const cell1 = newRow.insertCell(1);
    const cell2 = newRow.insertCell(2);
    const cell3 = newRow.insertCell(3);
    const durationCell = newRow.insertCell(4);
    const actionCell = newRow.insertCell(5);
    
    cell1.className = 'editable';
    cell1.contentEditable = true;
    cell1.textContent = startTime;
    
    cell2.className = 'editable';
    cell2.contentEditable = true;
    cell2.textContent = endTime;
    
    cell3.className = 'editable';
    cell3.contentEditable = true;
    cell3.textContent = title;
    
    // 计算时长
    const duration = calculateDuration(startTime, endTime);
    durationCell.className = 'duration-cell';
    durationCell.textContent = duration;
    
    // 添加删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-record-row-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', function() {
        if (confirm('确定要删除这一行吗？')) {
            tbody.removeChild(newRow);
        }
    });
    actionCell.appendChild(deleteBtn);
    
    // 添加时间变化监听器以自动计算时长
    cell1.addEventListener('input', function() {
        const duration = calculateDuration(cell1.textContent, cell2.textContent);
        durationCell.textContent = duration;
    });
    
    cell2.addEventListener('input', function() {
        const duration = calculateDuration(cell1.textContent, cell2.textContent);
        durationCell.textContent = duration;
    });
    
    // 添加点击事件以激活单元格
    cell1.addEventListener('click', function() {
        setActiveCell(this);
    });
    
    cell2.addEventListener('click', function() {
        setActiveCell(this);
    });
    
    cell3.addEventListener('click', function() {
        setActiveCell(this);
    });
    
    // 添加复选框事件监听器
    checkbox.addEventListener('change', function() {
        updateRecordSelectAllCheckbox();
    });
}



// 初始化视频压缩标签页
function initCompressTab() {
    // 页面加载时刷新视频列表
    refreshVideoList();
    
    // 选择视频文件后直接播放，不需要上传
    document.getElementById('compressVideoFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // 直接播放视频，不上传到服务器
            playCompressVideo(file);
            
            // 清除已选择的现有文件
            document.getElementById('existingVideoSelect').value = '';
            
            // 获取视频信息并显示压缩估算
            setTimeout(() => {
                updateCompressionEstimate(file);
            }, 1000);
        }
    });
    
    // 从已上传文件中选择视频
    document.getElementById('existingVideoSelect').addEventListener('change', function(e) {
        const selectedValue = e.target.value;
        if (selectedValue) {
            // 清除文件选择
            document.getElementById('compressVideoFile').value = '';
            
            // 设置上传路径
            uploadedCompressVideoPath = selectedValue;
            
            // 获取文件名
            const fileName = selectedValue.split('/').pop();
            document.getElementById('compressResult').textContent = '已选择文件: ' + fileName;
            
            // 获取压缩估算
            updateCompressionEstimateForUploadedVideo(selectedValue);
        }
    });
    
    // 刷新视频列表按钮
    document.getElementById('refreshVideoListBtn').addEventListener('click', function() {
        refreshVideoList();
    });
    
    // 上传视频按钮
    document.getElementById('uploadCompressVideoBtn').addEventListener('click', function() {
        const fileInput = document.getElementById('compressVideoFile');
        if (fileInput.files.length === 0) {
            alert('请先选择视频文件');
            return;
        }
        
        // 显示上传进度条
        const progressContainer = document.getElementById('compressVideoUploadProgressContainer');
        const progressBar = document.getElementById('compressVideoUploadProgress');
        const progressText = document.getElementById('compressVideoUploadProgressText');
        progressContainer.style.display = 'block';
        progressBar.value = 0;
        progressText.textContent = '0%';
        
        // 模拟上传进度（实际项目中应该通过真实的上传过程更新进度）
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 1;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.value = progress;
            progressText.textContent = progress + '%';
        }, 100);
        
        // 真实的上传逻辑（在模拟进度完成后执行）
        setTimeout(() => {
            const formData = new FormData();
            formData.append('video', fileInput.files[0]);
            
            fetch('/upload_video', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                
                if (data.error) {
                    alert('上传失败: ' + data.error);
                } else {
                    uploadedCompressVideoPath = data.filepath;
                    document.getElementById('compressResult').textContent = '视频上传成功: ' + data.filename;
                    
                    // 刷新视频列表
                    refreshVideoList();
                    
                    // 获取压缩估算
                    updateCompressionEstimateForUploadedVideo(data.filepath);
                }
            })
            .catch(error => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                
                console.error('Error:', error);
                alert('上传失败: ' + error);
            });
        }, 3000); // 3秒后执行真实上传
    });
    
    // 压缩预设改变时更新估算
    document.getElementById('compressionPreset').addEventListener('change', function() {
        const fileInput = document.getElementById('compressVideoFile');
        if (fileInput.files.length > 0) {
            updateCompressionEstimate(fileInput.files[0]);
        } else if (uploadedCompressVideoPath) {
            updateCompressionEstimateForUploadedVideo(uploadedCompressVideoPath);
        }
    });
    
    // 压缩速度改变时更新估算
    document.getElementById('compressionSpeed').addEventListener('change', function() {
        // 可以在这里添加速度改变时的逻辑
    });
    
    // 开始压缩按钮
    document.getElementById('compressButton').addEventListener('click', function() {
        compressVideo();
    });
    
    // 初始化视频播放器功能
    initCompressPlayer();
    
    // 初始化输出文件列表
    updateCompressOutputFilesList();
}

// 刷新视频列表
function refreshVideoList() {
    fetch('/list_upload_videos')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('existingVideoSelect');
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
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// 更新本地视频文件的压缩估算
function updateCompressionEstimate(file) {
    const fileSizeMB = file.size / (1024 * 1024);
    const preset = document.getElementById('compressionPreset').value;
    
    // 根据预设定义压缩比例
    const compressionRatios = {
        'low': 0.1,    // 压缩到原始大小的10%
        'medium': 0.25, // 压缩到原始大小的25%
        'high': 0.5    // 压缩到原始大小的50%
    };
    
    // 根据预设定义压缩速度（MB/分钟）
    const compressionSpeeds = {
        'low': 150,    // 低质量压缩速度
        'medium': 100, // 中等质量压缩速度
        'high': 60     // 高质量压缩速度
    };
    
    const ratio = compressionRatios[preset];
    const speed = compressionSpeeds[preset];
    
    const estimatedSize = fileSizeMB * ratio;
    const compressionRatio = (1 - ratio) * 100;
    const estimatedTimeMinutes = fileSizeMB / speed;
    
    // 更新界面显示
    document.getElementById('originalSize').textContent = fileSizeMB.toFixed(1) + ' MB';
    document.getElementById('estimatedSize').textContent = estimatedSize.toFixed(1) + ' MB';
    document.getElementById('compressionRatio').textContent = compressionRatio.toFixed(1) + '%';
    document.getElementById('estimatedTime').textContent = formatTime(estimatedTimeMinutes * 60);
}

// 更新已上传视频的压缩估算
function updateCompressionEstimateForUploadedVideo(videoPath) {
    const preset = document.getElementById('compressionPreset').value;
    
    // 发送请求到服务器获取压缩估算
    fetch('/get_compression_estimate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            video_path: videoPath,
            preset: preset
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('获取压缩估算失败:', data.error);
            return;
        }
        
        // 更新界面显示
        document.getElementById('originalSize').textContent = data.original_size.toFixed(1) + ' MB';
        document.getElementById('estimatedSize').textContent = data.estimated_size.toFixed(1) + ' MB';
        document.getElementById('compressionRatio').textContent = data.compression_ratio.toFixed(1) + '%';
        document.getElementById('estimatedTime').textContent = formatTime(data.estimated_time_minutes * 60);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// 格式化时间为HH:MM:SS格式
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
        return `${h}小时${m}分钟${s}秒`;
    } else if (m > 0) {
        return `${m}分钟${s}秒`;
    } else {
        return `${s}秒`;
    }
}

// 视频压缩功能
function compressVideo() {
    const resultBox = document.getElementById('compressResult');
    const preset = document.getElementById('compressionPreset').value;
    const speedMode = document.getElementById('compressionSpeed').value;
    
    // 检查是否已上传视频
    if (!uploadedCompressVideoPath) {
        alert('请先上传视频文件');
        return;
    }
    
    resultBox.textContent = "正在处理视频压缩...";
    
    // 发送请求到服务器
    fetch('/compress_video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            video_path: uploadedCompressVideoPath,
            preset: preset,
            speed_mode: speedMode
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultBox.textContent = '处理失败: ' + data.error;
        } else {
            resultBox.textContent = data.result;
            // 更新输出文件列表
            updateCompressOutputFilesList();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        resultBox.textContent = '处理失败: ' + error;
    });
}

// 播放压缩页面的视频文件
function playCompressVideo(file) {
    const videoPlayer = document.getElementById('compressVideoPlayer');
    const url = URL.createObjectURL(file);
    videoPlayer.src = url;
    videoPlayer.play();
}

// 初始化视频压缩页面的视频播放器
function initCompressPlayer() {
    const videoPlayer = document.getElementById('compressVideoPlayer');
    const currentTimeDisplay = document.getElementById('compressCurrentTime');
    const durationDisplay = document.getElementById('compressDuration');
    
    // 获取进度条元素
    const progressContainer = document.getElementById('compressProgressContainer');
    const progressBarFill = document.getElementById('compressProgressBarFill');
    
    // 视频时间更新
    videoPlayer.addEventListener('timeupdate', function() {
        if (videoPlayer.duration) {
            const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
            progressBarFill.style.width = percent + '%';
            
            currentTimeDisplay.textContent = secondsToHMS(videoPlayer.currentTime);
        }
    });
    
    // 视频加载元数据
    videoPlayer.addEventListener('loadedmetadata', function() {
        durationDisplay.textContent = secondsToHMS(videoPlayer.duration);
    });
    
    // 点击进度条跳转到指定位置
    progressContainer.addEventListener('click', function(e) {
        if (videoPlayer.duration) {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoPlayer.currentTime = pos * videoPlayer.duration;
        }
    });
    
    // 鼠标在进度条上移动时显示时间
    progressContainer.addEventListener('mousemove', function(e) {
        if (videoPlayer.duration) {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const hoverTime = pos * videoPlayer.duration;
            
            // 显示时间提示
            const hoverTimeDisplay = document.getElementById('compressHoverTimeDisplay');
            hoverTimeDisplay.textContent = secondsToHMS(hoverTime);
            
            // 设置位置
            const hoverPos = e.clientX - rect.left;
            hoverTimeDisplay.style.left = (hoverPos - 30) + 'px';
            hoverTimeDisplay.style.display = 'block';
        }
    });
    
    // 鼠标离开进度条时隐藏时间显示
    progressContainer.addEventListener('mouseleave', function() {
        const hoverTimeDisplay = document.getElementById('compressHoverTimeDisplay');
        hoverTimeDisplay.style.display = 'none';
    });
    
    // 播放/暂停按钮
    document.getElementById('compressPlayPauseBtn').addEventListener('click', function() {
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    });
}

// 更新视频压缩输出文件列表
function updateCompressOutputFilesList() {
    fetch('/list_output_files')
    .then(response => response.json())
    .then(data => {
        const listElement = document.getElementById('compressOutputFilesList');
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