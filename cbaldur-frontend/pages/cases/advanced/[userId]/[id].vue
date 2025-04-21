<template>
  <UCard class="h-full">
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between p-4 border-b">
        <p>高级绘图</p>
        <div class="flex space-x-2">
          <NuxtLink :to="`/cases/${userId}/${caseId}`">
            <UButton color="gray" variant="outline">返回普通绘图</UButton>
          </NuxtLink>
          <UButton v-if="selectedFile && isCodeFile(selectedFile)" @click="executeCode" color="green">执行</UButton>
          <UButton v-if="showEditor && isCodeFile(selectedFile??'')" @click="saveFile" color="blue">保存</UButton>
          <UButton @click="createNewFile" color="purple">新建画图</UButton>
        </div>
      </div>
      <div class="flex h-[calc(100vh-170px)] overflow-hidden">
        <!-- 左侧文件树 -->
        <div class="w-1/4 border-r p-2 overflow-y-auto">
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <p class="font-bold">文件浏览器</p>
              <USelect
                v-model="fileSort"
                :options="fileSortOptions"
                size="sm"
                class="w-28"
              />
            </div>
            <div v-if="isLoading" class="flex justify-center py-4">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
            </div>
            <div v-else-if="fileList.length === 0" class="text-gray-500 text-center py-4">
              无可用文件
            </div>
            <ul v-else class="space-y-1">
              <template v-for="fileGroup in groupedFiles" :key="fileGroup.type">
                <li class="mt-3 first:mt-0">
                  <p class="text-xs text-gray-500 font-medium mb-1 pl-2 uppercase">{{ getFileTypeLabel(fileGroup.type) }}</p>
                  <ul class="space-y-1">
                    <li v-for="file in fileGroup.files" :key="file.path">
                      <UButton
                        :class="selectedFile === file.path ? 'bg-gray-200 dark:bg-gray-800' : ''"
                        block
                        color="gray"
                        variant="ghost"
                        @click="selectFile(file.path)"
                      >
                        <div class="flex items-center">
                          <UIcon
                            :name="getIconForFile(file.path)"
                            class="mr-2"
                          />
                          {{ file.name }}
                        </div>
                      </UButton>
                    </li>
                  </ul>
                </li>
              </template>
            </ul>
          </div>
        </div>

        <!-- 右侧内容区 -->
        <div class="flex-1 overflow-hidden">
          <div v-if="!selectedFile" class="h-full flex items-center justify-center text-gray-400">
            <p>请从左侧选择文件或创建新文件</p>
          </div>
  
          <!-- 编辑器 -->
          <div v-else-if="showEditor" class="h-full">
            <client-only>
              <MonacoEditor
                v-model="fileContent"
                :lang="getLanguageForFile(selectedFile)"
                :options="{
                  language: getLanguageForFile(selectedFile),
                  theme: 'vs-dark',
                  automaticLayout: true,
                  scrollBeyondLastLine: false
                }"
                class="h-full"
              />
            </client-only>
          </div>
  
          <!-- 图片预览 -->
          <div v-else-if="isImageFile(selectedFile)" class="h-full flex items-center justify-center p-4 bg-[#1e1e1e]">
            <div class="max-h-full max-w-full overflow-auto">
              <img :src="imageUrl" class="max-w-full" alt="预览图片" />
            </div>
          </div>
  
          <!-- 其他文件类型 -->
          <div v-else class="h-full flex items-center justify-center text-gray-400">
            <p>不支持预览此类型的文件</p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
  
<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const userId = computed(() => route.params.userId);
const caseId = computed(() => route.params.id);
const { public: {backendURL} } = useRuntimeConfig()
// 文件列表
const fileList = ref<{ name: string, path: string, type: string, lastModified: Date }[]>([]);
const isLoading = ref(true);
const selectedFile = ref<string | null>(null);
const fileContent = ref('');
const showEditor = ref(false);
const imageUrl = ref('');

// 文件排序
const fileSort = ref('name');
const fileSortOptions = [
  { label: '按类型', value: 'type' },
  { label: '按名称', value: 'name' }
];

// 根据排序获取分组的文件
const groupedFiles = computed(() => {
  // 复制数组，避免直接修改原数组
  const files = [...fileList.value];
  
  // 根据选项排序
  if (fileSort.value === 'name') {
    files.sort((a, b) => a.name.localeCompare(b.name));
  } else if (fileSort.value === 'time') {
    files.sort((a, b) => {
      if (a.lastModified && b.lastModified) {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
      return 0;
    });
  }
  
  // 按文件类型分组
  const groups: Record<string, { type: string, files: typeof files }> = {};
  
  files.forEach(file => {
    const type = getFileType(file.path);
    if (!groups[type]) {
      groups[type] = {
        type,
        files: []
      };
    }
    groups[type].files.push(file);
  });
  
  // 如果不是按类型排序，那么每个类型内的文件还需要按照选定的排序方式排序
  if (fileSort.value !== 'type') {
    Object.keys(groups).forEach(type => {
      if (fileSort.value === 'name') {
        groups[type].files.sort((a, b) => a.name.localeCompare(b.name));
      } else if (fileSort.value === 'time') {
        groups[type].files.sort((a, b) => {
          if (a.lastModified && b.lastModified) {
            return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
          }
          return 0;
        });
      }
    });
  }
  
  // 转换为数组并根据类型的重要性排序
  const typeOrder = { 'code': 0, 'image': 1, 'data': 2, 'other': 3 };
  return Object.values(groups).sort((a, b) => typeOrder[a.type as keyof typeof typeOrder] - typeOrder[b.type as keyof typeof typeOrder]);
});

// 获取文件类型的显示标签
const getFileTypeLabel = (type: string): string => {
  switch (type) {
    case 'code': return '代码文件';
    case 'data': return '数据文件';
    case 'image': return '图像文件';
    default: return '其他文件';
  }
};

// 加载文件列表
const loadFileList = async () => {
  isLoading.value = true;
  try {
    // 使用API获取文件列表
    const response = await $$fetch('/api/Case/GetCaseFiles', {
      method: 'GET',
      query: {
        userId: Number(userId.value),
        caseId: Number(caseId.value),
      }
    });
    
    // 过滤我们需要的文件类型
    fileList.value = response.map((file: any) => ({
      name: file.name,
      path: file.path,
      type: file.type || getFileType(file.path),
      lastModified: file.lastModified ? new Date(file.lastModified) : new Date()
    })).filter((file: any) => {
      const ext = file.path.split('.').pop()?.toLowerCase();
      return ['csv', 'py', 'png', 'gif', 'jpg', 'jpeg'].includes(ext);
    });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    // 临时模拟数据用于演示
    fileList.value = [
      { name: 'plot.py', path: 'plot.py', type: 'code', lastModified: new Date() },
      { name: 'data.csv', path: 'data.csv', type: 'data', lastModified: new Date() },
      { name: 'result.png', path: 'result.png', type: 'image', lastModified: new Date() }
    ];
  } finally {
    isLoading.value = false;
  }
};

// 选择文件
const selectFile = async (path: string) => {
  selectedFile.value = path;
  if (isCodeFile(path) || isDataFile(path)) {
    try {
      // 通过API获取文件内容
      const response = await $$fetch('/api/Case/GetFileContent', {
        method: 'GET',
        query: {
          userId: Number(userId.value),
          caseId: Number(caseId.value),
          filePath: path,
          type: 'text'
        }
      });
      fileContent.value = response;
      showEditor.value = true;
    } catch (error) {
      console.error('获取文件内容失败:', error);
      // 模拟数据
      if (path.endsWith('.py')) {
        fileContent.value = '# 绘图代码\nimport matplotlib.pyplot as plt\nimport numpy as np\n\n# 生成数据\nx = np.linspace(0, 10, 100)\ny = np.sin(x)\n\n# 绘图\nplt.figure(figsize=(10, 6))\nplt.plot(x, y)\nplt.title("Sine Wave")\nplt.xlabel("x")\nplt.ylabel("sin(x)")\nplt.grid(True)\nplt.savefig("result.png")\nplt.show()';
      } else if (path.endsWith('.csv')) {
        fileContent.value = 'x,y\n0,0\n1,1\n2,4\n3,9\n4,16';
      }
      showEditor.value = true;
    }
  } else if (isImageFile(path)) {
    // 构建图片URL
    imageUrl.value = `${backendURL}/api/Case/GetFileContent?userId=${userId.value}&caseId=${caseId.value}&filePath=${path}&type=binary`;
    showEditor.value = false;
  } else {
    showEditor.value = false;
  }
};

// 保存文件
const saveFile = async () => {
  if (!selectedFile.value) return;
  
  try {
    await $$fetch('/api/Case/SaveFile', {
      method: 'POST',
      body: {
        userId: Number(userId.value),
        caseId: Number(caseId.value),
        filePath: selectedFile.value,
        content: fileContent.value
      }
    });
    // 成功提示
    alert('文件保存成功！');
  } catch (error) {
    console.error('保存文件失败:', error);
    // 错误提示
    alert('保存文件失败，请重试！');
  }
};

// 执行Python代码
const executeCode = async () => {
  if (!selectedFile.value || !selectedFile.value.endsWith('.py')) return;
  
  try {  
    // 执行代码
    await $$fetch('/api/Case/ExecuteCode', {
      method: 'POST',
      body: {
        userId: Number(userId.value),
        caseId: Number(caseId.value),
        fileContent: fileContent.value
      }
    });
    
    // 刷新文件列表以显示新生成的文件
    await loadFileList();
    
    // 成功提示
    alert('代码执行成功！');
  } catch (error) {
    console.error('执行代码失败:', error);
    // 错误提示
    alert('执行代码失败，请检查代码或重试！');
  }
};

// 创建新文件
const createNewFile = async () => {
  const filename = prompt('请输入文件名（例如：plot.py）：');
  if (!filename) return;
  
  // 确保有正确的扩展名
  const name = filename.endsWith('.py') ? filename : `${filename}.py`;
  const defaultContent = `# 代码执行器中安装了numpy,scipy,pandas,matplotlib,seaborn和plotly用于画图
# 代码执行器中有Alibaba PuHuiTi 3.0作为中文字体以支持中文环境
# 以下是使用seaborn、matplotlib和pandas的散点图示例
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
font_path = '/usr/share/fonts/AlibabaPuHuiTi.otf'
font = FontProperties(fname=font_path)

df = pd.read_csv('comma_eq1D_100.076.dat.csv')

sns.set(style="whitegrid")

plt.figure(figsize=(10, 6))
sns.scatterplot(data=df, x=' psi_p/(2pi)', y='pres(Pa)', color='red', alpha=0.5)

plt.title('散点图示例',fontproperties=font)
plt.xlabel('X轴标签',fontproperties=font)
plt.ylabel('Y轴标签',fontproperties=font)

plt.savefig('plot.png', dpi=300, bbox_inches='tight')
`;
  
  try {
    // 直接保存新文件到服务器
    await $$fetch('/api/Case/SaveFile', {
      method: 'POST',
      body: {
        userId: Number(userId.value),
        caseId: Number(caseId.value),
        filePath: name,
        content: defaultContent
      }
    });
    
    // 刷新文件列表
    await loadFileList();
    
    // 选择并打开新创建的文件
    await selectFile(name);
    
    // 成功提示
    // alert('文件创建成功！');
  } catch (error) {
    console.error('创建文件失败:', error);
    alert('创建文件失败，请重试！');
  }
};

// 工具函数
const isCodeFile = (path: string): boolean => {
  return path.endsWith('.py');
};

const isDataFile = (path: string): boolean => {
  return path.endsWith('.csv') || path.endsWith('.txt');
};

const isImageFile = (path: string): boolean => {
  const ext = path.split('.').pop()?.toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif'].includes(ext || '');
};

const getFileType = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  
  if (ext === 'py') return 'code';
  if (ext === 'csv' || ext === 'txt') return 'data';
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) return 'image';
  return 'other';
};

const getLanguageForFile = (path: string): string => {
  if (path.endsWith('.py')) return 'python';
  if (path.endsWith('.csv')) return 'plaintext';
  return 'plaintext';
};

const getIconForFile = (path: string): string => {
  if (path.endsWith('.py')) return 'i-heroicons-code-bracket';
  if (path.endsWith('.csv')) return 'i-heroicons-table-cells';
  if (isImageFile(path)) return 'i-heroicons-photo';
  return 'i-heroicons-document';
};

onMounted(() => {
  loadFileList();
});
</script>

<style scoped>
.monaco-editor {
  width: 100%;
  height: 100%;
}
</style>