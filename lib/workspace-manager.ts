/**
 * 工作区管理系统
 * 让 AI 可以在指定文件夹中自由操作，类似 Cursor
 */

import { readdir, stat, readFile, writeFile, mkdir, unlink, rename } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// 工作区状态
let currentWorkspace: string = process.cwd();
let workspaceFiles: Map<string, any> = new Map();

/**
 * 设置工作区
 */
export async function setWorkspace(workspacePath: string): Promise<any> {
  try {
    const fullPath = path.isAbsolute(workspacePath) 
      ? workspacePath 
      : path.join(process.cwd(), workspacePath);

    if (!existsSync(fullPath)) {
      return {
        error: "工作区不存在",
        path: workspacePath,
        suggestion: "请提供有效的文件夹路径",
      };
    }

    const stats = await stat(fullPath);
    if (!stats.isDirectory()) {
      return {
        error: "不是文件夹",
        path: workspacePath,
      };
    }

    currentWorkspace = fullPath;

    // 扫描工作区
    const scan = await scanWorkspace();

    return {
      success: true,
      workspace: fullPath,
      totalFiles: scan.totalFiles,
      totalFolders: scan.totalFolders,
      structure: scan.structure,
      note: `✅ 工作区已设置: ${fullPath}`,
    };
  } catch (error: any) {
    return {
      error: "设置工作区失败",
      message: error.message,
    };
  }
}

/**
 * 扫描工作区
 */
export async function scanWorkspace(maxDepth: number = 3): Promise<any> {
  try {
    const structure = await scanDirectory(currentWorkspace, 0, maxDepth);
    
    return {
      workspace: currentWorkspace,
      ...structure,
      note: `✅ 工作区扫描完成`,
    };
  } catch (error: any) {
    throw new Error(`工作区扫描失败: ${error.message}`);
  }
}

/**
 * 递归扫描目录
 */
async function scanDirectory(dirPath: string, currentDepth: number, maxDepth: number): Promise<any> {
  if (currentDepth >= maxDepth) {
    return { files: [], folders: [], totalFiles: 0, totalFolders: 0 };
  }

  const items = await readdir(dirPath);
  const files = [];
  const folders = [];
  let totalFiles = 0;
  let totalFolders = 0;

  for (const item of items) {
    // 跳过隐藏文件和特殊目录
    if (item.startsWith('.') || item === 'node_modules') continue;

    const itemPath = path.join(dirPath, item);
    const stats = await stat(itemPath);

    if (stats.isDirectory()) {
      folders.push(item);
      totalFolders++;
      
      if (currentDepth + 1 < maxDepth) {
        const subScan = await scanDirectory(itemPath, currentDepth + 1, maxDepth);
        totalFiles += subScan.totalFiles;
        totalFolders += subScan.totalFolders;
      }
    } else {
      files.push({
        name: item,
        size: stats.size,
        modified: stats.mtime,
        ext: path.extname(item),
      });
      totalFiles++;
    }
  }

  return {
    path: dirPath.replace(currentWorkspace, '').replace(/^\//, '') || '/',
    files: files,
    folders: folders,
    totalFiles: totalFiles,
    totalFolders: totalFolders,
    structure: folders.length > 0 ? { files, folders } : null,
  };
}

/**
 * 在工作区中读取文件
 */
export async function readFileInWorkspace(relativePath: string): Promise<any> {
  try {
    const fullPath = path.join(currentWorkspace, relativePath);

    if (!fullPath.startsWith(currentWorkspace)) {
      return {
        error: "安全限制",
        message: "只能访问工作区内的文件",
      };
    }

    if (!existsSync(fullPath)) {
      return {
        error: "文件不存在",
        path: relativePath,
      };
    }

    const content = await readFile(fullPath, 'utf-8');
    const stats = await stat(fullPath);

    return {
      path: relativePath,
      content: content,
      size: stats.size,
      lines: content.split('\n').length,
      note: `✅ 文件已读取: ${relativePath}`,
    };
  } catch (error: any) {
    return {
      error: "读取文件失败",
      message: error.message,
      path: relativePath,
    };
  }
}

/**
 * 在工作区中写入文件
 */
export async function writeFileInWorkspace(relativePath: string, content: string): Promise<any> {
  try {
    const fullPath = path.join(currentWorkspace, relativePath);

    if (!fullPath.startsWith(currentWorkspace)) {
      return {
        error: "安全限制",
        message: "只能写入工作区内的文件",
      };
    }

    // 确保目录存在
    const dir = path.dirname(fullPath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(fullPath, content, 'utf-8');
    const stats = await stat(fullPath);

    return {
      success: true,
      path: relativePath,
      size: stats.size,
      note: `✅ 文件已写入: ${relativePath}`,
    };
  } catch (error: any) {
    return {
      error: "写入文件失败",
      message: error.message,
      path: relativePath,
    };
  }
}

/**
 * 在工作区中创建文件夹
 */
export async function createFolderInWorkspace(relativePath: string): Promise<any> {
  try {
    const fullPath = path.join(currentWorkspace, relativePath);

    if (!fullPath.startsWith(currentWorkspace)) {
      return {
        error: "安全限制",
        message: "只能在工作区内创建文件夹",
      };
    }

    await mkdir(fullPath, { recursive: true });

    return {
      success: true,
      path: relativePath,
      fullPath: fullPath,
      note: `✅ 文件夹已创建: ${relativePath}`,
    };
  } catch (error: any) {
    return {
      error: "创建文件夹失败",
      message: error.message,
    };
  }
}

/**
 * 在工作区中删除文件
 */
export async function deleteFileInWorkspace(relativePath: string): Promise<any> {
  try {
    const fullPath = path.join(currentWorkspace, relativePath);

    if (!fullPath.startsWith(currentWorkspace)) {
      return {
        error: "安全限制",
        message: "只能删除工作区内的文件",
      };
    }

    if (!existsSync(fullPath)) {
      return {
        error: "文件不存在",
        path: relativePath,
      };
    }

    await unlink(fullPath);

    return {
      success: true,
      path: relativePath,
      note: `✅ 文件已删除: ${relativePath}`,
    };
  } catch (error: any) {
    return {
      error: "删除文件失败",
      message: error.message,
    };
  }
}

/**
 * 在工作区中搜索文件
 */
export async function searchInWorkspace(query: string, fileType?: string): Promise<any> {
  try {
    const results: any[] = [];

    async function searchDir(dirPath: string, depth: number = 0) {
      if (depth > 3) return;

      const items = await readdir(dirPath);

      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;

        const itemPath = path.join(dirPath, item);
        const stats = await stat(itemPath);
        const relativePath = itemPath.replace(currentWorkspace, '').replace(/^\//, '');

        if (stats.isFile()) {
          const matchName = item.toLowerCase().includes(query.toLowerCase());
          const matchType = !fileType || item.endsWith(fileType);

          if (matchName && matchType) {
            results.push({
              path: relativePath,
              name: item,
              size: stats.size,
              modified: stats.mtime,
            });
          }
        } else if (stats.isDirectory()) {
          await searchDir(itemPath, depth + 1);
        }
      }
    }

    await searchDir(currentWorkspace);

    return {
      query: query,
      found: results.length,
      files: results.slice(0, 50), // 限制返回数量
      note: `✅ 找到 ${results.length} 个匹配文件`,
    };
  } catch (error: any) {
    return {
      error: "搜索失败",
      message: error.message,
    };
  }
}

/**
 * 获取当前工作区
 */
export function getCurrentWorkspace(): string {
  return currentWorkspace;
}

/**
 * 获取工作区信息
 */
export async function getWorkspaceInfo(): Promise<any> {
  try {
    const scan = await scanWorkspace(2);

    return {
      workspace: currentWorkspace,
      totalFiles: scan.totalFiles,
      totalFolders: scan.totalFolders,
      note: `✅ 当前工作区: ${currentWorkspace}`,
    };
  } catch (error: any) {
    return {
      error: "获取工作区信息失败",
      message: error.message,
    };
  }
}




