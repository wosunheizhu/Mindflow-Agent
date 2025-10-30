/**
 * 文件系统操作工具
 * 提供文件和文件夹的各种操作
 */

import { 
  readdir, 
  stat, 
  mkdir, 
  unlink, 
  rmdir, 
  rename, 
  copyFile,
  writeFile,
  readFile 
} from "fs/promises";
import path from "path";
import { existsSync } from "fs";

/**
 * 列出目录内容
 */
export async function listDirectory(dirPath: string = 'uploads'): Promise<any> {
  try {
    const fullPath = path.join(process.cwd(), dirPath);
    
    if (!existsSync(fullPath)) {
      return {
        path: dirPath,
        exists: false,
        items: [],
        message: "目录不存在",
      };
    }

    const items = await readdir(fullPath);
    const itemDetails = await Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(fullPath, item);
        const stats = await stat(itemPath);
        return {
          name: item,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime,
        };
      })
    );

    return {
      path: dirPath,
      exists: true,
      totalItems: items.length,
      files: itemDetails.filter(i => i.type === 'file').length,
      directories: itemDetails.filter(i => i.type === 'directory').length,
      items: itemDetails,
    };
  } catch (error: any) {
    throw new Error(`列出目录失败: ${error.message}`);
  }
}

/**
 * 创建文件夹
 */
export async function createDirectory(dirPath: string): Promise<string> {
  try {
    const fullPath = path.join(process.cwd(), dirPath);
    await mkdir(fullPath, { recursive: true });
    return fullPath;
  } catch (error: any) {
    throw new Error(`创建文件夹失败: ${error.message}`);
  }
}

/**
 * 删除文件
 */
export async function deleteFile(filepath: string): Promise<boolean> {
  try {
    const fullPath = path.join(process.cwd(), filepath);
    
    if (!existsSync(fullPath)) {
      return false;
    }

    await unlink(fullPath);
    return true;
  } catch (error: any) {
    throw new Error(`删除文件失败: ${error.message}`);
  }
}

/**
 * 删除文件夹
 */
export async function deleteDirectory(dirPath: string): Promise<boolean> {
  try {
    const fullPath = path.join(process.cwd(), dirPath);
    
    if (!existsSync(fullPath)) {
      return false;
    }

    await rmdir(fullPath, { recursive: true });
    return true;
  } catch (error: any) {
    throw new Error(`删除文件夹失败: ${error.message}`);
  }
}

/**
 * 移动/重命名文件
 */
export async function moveFile(oldPath: string, newPath: string): Promise<string> {
  try {
    const fullOldPath = path.join(process.cwd(), oldPath);
    const fullNewPath = path.join(process.cwd(), newPath);

    if (!existsSync(fullOldPath)) {
      throw new Error("源文件不存在");
    }

    // 确保目标目录存在
    const newDir = path.dirname(fullNewPath);
    if (!existsSync(newDir)) {
      await mkdir(newDir, { recursive: true });
    }

    await rename(fullOldPath, fullNewPath);
    return fullNewPath;
  } catch (error: any) {
    throw new Error(`移动文件失败: ${error.message}`);
  }
}

/**
 * 复制文件
 */
export async function copyFileOp(sourcePath: string, destPath: string): Promise<string> {
  try {
    const fullSourcePath = path.join(process.cwd(), sourcePath);
    const fullDestPath = path.join(process.cwd(), destPath);

    if (!existsSync(fullSourcePath)) {
      throw new Error("源文件不存在");
    }

    // 确保目标目录存在
    const destDir = path.dirname(fullDestPath);
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true });
    }

    await copyFile(fullSourcePath, fullDestPath);
    return fullDestPath;
  } catch (error: any) {
    throw new Error(`复制文件失败: ${error.message}`);
  }
}

/**
 * 重命名文件
 */
export async function renameFile(oldName: string, newName: string, directory: string = 'uploads'): Promise<string> {
  try {
    const dir = path.join(process.cwd(), directory);
    const oldPath = path.join(dir, oldName);
    const newPath = path.join(dir, newName);

    if (!existsSync(oldPath)) {
      throw new Error(`文件不存在: ${oldName}`);
    }

    await rename(oldPath, newPath);
    return newPath;
  } catch (error: any) {
    throw new Error(`重命名失败: ${error.message}`);
  }
}

/**
 * 获取文件信息
 */
export async function getFileInfo(filepath: string): Promise<any> {
  try {
    const fullPath = path.join(process.cwd(), filepath);
    
    if (!existsSync(fullPath)) {
      return { exists: false };
    }

    const stats = await stat(fullPath);
    
    return {
      exists: true,
      path: filepath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
    };
  } catch (error: any) {
    throw new Error(`获取文件信息失败: ${error.message}`);
  }
}

