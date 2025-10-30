/**
 * 数据可视化工具（简化版本）
 * 生成 HTML 图表文件，使用 Chart.js CDN
 */

import { writeFile } from 'fs/promises';
import path from 'path';

/**
 * 生成 HTML 图表文件
 */
export async function generateChart(
  type: 'bar' | 'line' | 'pie' | 'scatter',
  data: any,
  options?: any
): Promise<string> {
  try {
    const outputDir = path.join(process.cwd(), 'outputs');
    const filename = `chart_${Date.now()}.html`;
    const filepath = path.join(outputDir, filename);

    // 生成 HTML 内容
    const html = generateChartHTML(type, data, options);

    await writeFile(filepath, html, 'utf-8');

    return filepath;
  } catch (error: any) {
    throw new Error(`图表生成失败: ${error.message}`);
  }
}

/**
 * 生成图表 HTML
 */
function generateChartHTML(type: string, data: any, options?: any): string {
  const title = options?.title || '数据图表';
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1e3a8a;
            margin-bottom: 20px;
        }
        canvas {
            max-width: 100%;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <canvas id="myChart"></canvas>
    </div>
    <script>
        const ctx = document.getElementById('myChart');
        new Chart(ctx, ${JSON.stringify({
          type: type,
          data: data,
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: title
              }
            }
          }
        })});
    </script>
</body>
</html>`;
}

/**
 * 快速生成柱状图
 */
export async function createBarChart(labels: string[], values: number[], title?: string): Promise<string> {
  const colors = labels.map((_, i) => {
    const hue = (i * 60) % 360;
    return `hsla(${hue}, 70%, 50%, 0.8)`;
  });

  const data = {
    labels: labels,
    datasets: [{
      label: title || '数据',
      data: values,
      backgroundColor: colors,
      borderColor: colors.map(c => c.replace('0.8', '1')),
      borderWidth: 2,
    }],
  };

  return await generateChart('bar', data, { title });
}

/**
 * 快速生成折线图
 */
export async function createLineChart(labels: string[], datasets: any[], title?: string): Promise<string> {
  const data = {
    labels: labels,
    datasets: datasets.map((ds: any, idx: number) => {
      const hue = idx * 120;
      return {
        label: ds.label || `数据集 ${idx + 1}`,
        data: ds.data || ds,
        borderColor: `hsl(${hue}, 70%, 50%)`,
        backgroundColor: `hsla(${hue}, 70%, 50%, 0.1)`,
        tension: 0.4,
        borderWidth: 3,
      };
    }),
  };

  return await generateChart('line', data, { title });
}

/**
 * 快速生成饼图
 */
export async function createPieChart(labels: string[], values: number[], title?: string): Promise<string> {
  const colors = labels.map((_, i) => {
    const hue = (i * 360) / labels.length;
    return `hsla(${hue}, 70%, 60%, 0.9)`;
  });

  const data = {
    labels: labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderColor: '#fff',
      borderWidth: 3,
    }],
  };

  return await generateChart('pie', data, { title });
}

