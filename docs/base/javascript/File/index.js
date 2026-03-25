/**
 * 前端文件处理知识点速查
 * 说明：
 * 1) “所有文件类型”在工程上无法穷举，这里给的是前端高频 + 通用类别。
 * 2) 文件判断建议：扩展名 + MIME + 文件头（魔数）三层校验。
 */

/* -------------------------------------------------------------------------- */
/* 0. 一页总结（先看）                                                          */
/* -------------------------------------------------------------------------- */

export const FILE_UPLOAD_SUMMARY = {
  coreRule: '前端只做体验与基础校验，真正安全校验必须在服务端完成。',
  fileTypes: [
    '图片：jpg/png/webp/svg',
    '视频：mp4/webm/mov',
    '音频：mp3/wav/aac',
    '文档：pdf/docx/xlsx/csv',
    '压缩包：zip/rar/7z',
  ],
  commonScenarios: [
    '头像/相册上传（预览、压缩、裁剪）',
    '附件上传（合同、表单、工单）',
    '大文件上传（分片、断点续传、秒传）',
    '导入导出（CSV/Excel/PDF）',
    '拖拽/粘贴/目录上传',
  ],
  uploadFlow: [
    '选文件 -> 前端基础校验 -> 生成 FormData/分片 -> 上传 -> 服务端存储 -> 返回 URL/ID',
    '大文件：init -> chunk -> status -> complete',
  ],
  resumeUpload: [
    '后端要保存 uploadId、totalChunks、uploadedChunks、文件哈希/大小',
    '恢复时先查 status，只上传缺失分片',
    'complete 前校验分片完整性与哈希',
  ],
  keyApis: [
    'File/Blob/FileList/FormData',
    'FileReader',
    'URL.createObjectURL / URL.revokeObjectURL',
    'fetch / XMLHttpRequest',
    'Drag & Drop / Clipboard / File System Access API',
  ],
  securityChecklist: [
    '不要只信 accept，服务端二次校验类型与内容',
    '限制大小、数量、频率，做重试与限流',
    '跨域上传用 CORS 或预签名 URL',
    '敏感文件做权限控制、病毒扫描、审计日志',
  ],
};

/* -------------------------------------------------------------------------- */
/* 1. 常见文件类型（按类别）                                                   */
/* -------------------------------------------------------------------------- */

export const FILE_TYPES = {
  image: {
    exts: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.bmp', '.ico', '.heic'],
    mimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'],
  },
  video: {
    exts: ['.mp4', '.webm', '.ogg', '.mov', '.mkv', '.avi'],
    mimes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  },
  audio: {
    exts: ['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg'],
    mimes: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/mp4', 'audio/flac', 'audio/ogg'],
  },
  document: {
    exts: ['.txt', '.md', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv'],
    mimes: [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
  },
  archive: {
    exts: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    mimes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
  },
  data: {
    exts: ['.json', '.xml', '.yaml', '.yml'],
    mimes: ['application/json', 'application/xml', 'text/xml', 'application/yaml', 'text/yaml'],
  },
  font: {
    exts: ['.woff', '.woff2', '.ttf', '.otf'],
    mimes: ['font/woff', 'font/woff2', 'font/ttf', 'font/otf'],
  },
  webAsset: {
    exts: ['.html', '.css', '.js', '.mjs', '.ts', '.tsx', '.jsx', '.wasm', '.map'],
    mimes: ['text/html', 'text/css', 'text/javascript', 'application/wasm', 'application/json'],
  },
};

/* -------------------------------------------------------------------------- */
/* 2. 前端“上传/操作文件”常见场景                                                */
/* -------------------------------------------------------------------------- */

export const FILE_SCENARIOS = [
  '头像上传（单图、裁剪、压缩、预览）',
  '相册/工单多图上传（多选、拖拽排序、并发上传）',
  '大文件上传（分片、断点续传、秒传）',
  '表单附件上传（PDF/Office/压缩包）',
  '导入数据（CSV/Excel）',
  '导出文件（CSV/Excel/PDF）',
  '粘贴上传（剪贴板图片）',
  '拖拽上传（DataTransfer）',
  '目录上传（webkitdirectory）',
  '录音/录屏后上传（MediaRecorder -> Blob）',
  '在线预览（图片、音视频、PDF、文本）',
  '本地编辑后保存（File System Access API）',
];

/* -------------------------------------------------------------------------- */
/* 3. 文件相关核心 API                                                         */
/* -------------------------------------------------------------------------- */

export const FILE_APIS = {
  fileInput: '<input type="file" />',
  File: 'name/size/type/lastModified',
  Blob: '二进制数据容器，可切片 slice',
  FileList: 'input.files 返回集合',
  FormData: 'multipart/form-data 上传',
  FileReader: 'readAsText/readAsDataURL/readAsArrayBuffer',
  URLObject: 'URL.createObjectURL / URL.revokeObjectURL',
  FetchXHR: 'fetch 上传；XHR 可拿上传进度 onprogress',
  DragDrop: 'dragenter/dragover/drop + DataTransfer',
  Clipboard: 'paste/Clipboard API',
  Streams: 'ReadableStream / WritableStream（大文件流式处理）',
  FileSystemAccess: 'showOpenFilePicker/showSaveFilePicker（兼容性受限）',
};

/* -------------------------------------------------------------------------- */
/* 4. 上传链路高频知识点                                                        */
/* -------------------------------------------------------------------------- */

export const UPLOAD_KNOWLEDGE = [
  'accept 只做选择器提示，不是安全校验；服务端必须二次校验。',
  '校验建议：类型（MIME+魔数）/大小/数量/分辨率/时长/文件名规范。',
  '图片预览优先 createObjectURL，用完及时 revoke 防止内存泄漏。',
  '大文件建议分片：切片 -> 并发上传 -> 合并 -> 校验（MD5/ETag）。',
  '断点续传依赖 uploadId + 已上传分片索引；失败重试要有退避策略。',
  '上传进度：fetch 无原生 upload progress（可用 XHR 或分片进度聚合）。',
  '跨域上传：CORS、预签名 URL（S3/OSS/COS）是常见做法。',
  '敏感文件要做病毒扫描、内容审计、权限控制和临时链接。',
  'SVG 可能包含脚本，展示前要清洗或转码。',
  '下载文件注意 Content-Disposition、文件名编码和流式下载。',
];

/* -------------------------------------------------------------------------- */
/* 5. 代码模板                                                                 */
/* -------------------------------------------------------------------------- */

// 5.1 单文件上传（FormData + fetch）
export async function uploadSingleFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }

  return res.json();
}

// 5.2 图片本地预览（记得释放 URL）
export function createPreviewURL(file) {
  return URL.createObjectURL(file);
}

export function revokePreviewURL(url) {
  URL.revokeObjectURL(url);
}

// 5.3 分片切割
export function sliceFile(file, chunkSize = 2 * 1024 * 1024) {
  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push({
      index,
      chunk: file.slice(start, end),
      start,
      end,
    });
    start = end;
    index += 1;
  }

  return chunks;
}

// 5.4 拖拽拿文件
export function getFilesFromDropEvent(event) {
  event.preventDefault();
  return Array.from(event.dataTransfer?.files || []);
}

/* -------------------------------------------------------------------------- */
/* 6. 面试/实战高频问答（关键词）                                               */
/* -------------------------------------------------------------------------- */

export const FAQ_KEYWORDS = [
  '为什么前端限制 accept 仍然不安全？',
  '为什么上传校验必须放在服务端？',
  '大文件分片如何实现断点续传？',
  '秒传依赖什么（hash + 服务端去重）？',
  'fetch 与 XHR 在上传能力上的差异？',
  '跨域直传 OSS/S3 为什么常配预签名 URL？',
];
