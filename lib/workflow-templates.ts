/**
 * 预定义工作流模板
 */

import { WorkflowTemplate } from './workflow-types';

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'research_and_summarize',
    name: '研究并总结',
    description: '搜索主题、访问网页、生成总结报告',
    category: '研究',
    workflow: {
      name: '研究并总结工作流',
      description: '自动搜索、访问网站并生成总结',
      steps: [
        {
          id: 'step1',
          name: '搜索信息',
          tool: 'search_web',
          params: {
            query: '${topic}',
          },
          nextSteps: ['step2'],
        },
        {
          id: 'step2',
          name: '访问第一个结果',
          tool: 'visit_website',
          params: {
            url: '${step_step1.results[0].url}',
          },
          nextSteps: ['step3'],
        },
        {
          id: 'step3',
          name: '生成总结',
          tool: 'execute_code',
          params: {
            code: 'print("研究总结：基于搜索和网页内容")',
            language: 'python',
          },
        },
      ],
      startStep: 'step1',
      variables: {
        topic: '人工智能最新进展',
      },
    },
    example: '自动搜索某个主题，访问相关网站，并生成总结报告',
  },
  {
    id: 'document_analysis',
    name: '文档深度分析',
    description: '读取文档、提取关键信息、生成分析报告',
    category: '文档处理',
    workflow: {
      name: '文档分析工作流',
      description: '自动分析文档并生成报告',
      steps: [
        {
          id: 'step1',
          name: '读取文档',
          tool: 'read_file',
          params: {
            filename: '${filename}',
          },
          nextSteps: ['step2'],
        },
        {
          id: 'step2',
          name: '搜索相关信息',
          tool: 'search_web',
          params: {
            query: '${step_step1.filename} 相关研究',
          },
          nextSteps: ['step3'],
        },
        {
          id: 'step3',
          name: '生成分析报告',
          tool: 'execute_code',
          params: {
            code: 'print("文档分析完成")',
            language: 'python',
          },
        },
      ],
      startStep: 'step1',
      variables: {
        filename: 'document.pdf',
      },
    },
    example: '读取文档，搜索相关信息，生成综合分析报告',
  },
  {
    id: 'web_scraping_pipeline',
    name: '网页数据采集',
    description: '搜索、访问、提取、分析网页数据',
    category: '数据采集',
    workflow: {
      name: '网页数据采集工作流',
      description: '自动化网页数据采集和分析',
      steps: [
        {
          id: 'step1',
          name: '搜索目标网站',
          tool: 'search_web',
          params: {
            query: '${search_query}',
          },
          nextSteps: ['step2'],
        },
        {
          id: 'step2',
          name: '访问网站',
          tool: 'visit_website',
          params: {
            url: '${step_step1.results[0].url}',
          },
          nextSteps: ['step3'],
        },
        {
          id: 'step3',
          name: '数据分析',
          tool: 'execute_code',
          params: {
            code: 'print("数据采集完成")',
            language: 'python',
          },
        },
      ],
      startStep: 'step1',
      variables: {
        search_query: 'GitHub trending',
      },
    },
    example: '搜索网站，访问并提取数据，进行分析',
  },
  {
    id: 'image_generation_pipeline',
    name: '图像创作流水线',
    description: '搜索参考、分析风格、生成图像',
    category: '创意',
    workflow: {
      name: '图像创作工作流',
      description: '基于搜索和分析生成图像',
      steps: [
        {
          id: 'step1',
          name: '搜索参考',
          tool: 'search_web',
          params: {
            query: '${theme} 设计风格',
          },
          nextSteps: ['step2'],
        },
        {
          id: 'step2',
          name: '访问参考网站',
          tool: 'visit_website',
          params: {
            url: '${step_step1.results[0].url}',
          },
          nextSteps: ['step3'],
        },
        {
          id: 'step3',
          name: '生成图像',
          tool: 'generate_image',
          params: {
            prompt: '${theme} 风格的设计图，专业、现代',
            size: '1024x1024',
          },
        },
      ],
      startStep: 'step1',
      variables: {
        theme: '未来科技',
      },
    },
    example: '搜索设计参考，访问网站了解风格，生成相应图像',
  },
  {
    id: 'code_analysis',
    name: '代码分析和优化',
    description: '搜索最佳实践、执行代码、生成优化建议',
    category: '编程',
    workflow: {
      name: '代码分析工作流',
      description: '分析代码并提供优化建议',
      steps: [
        {
          id: 'step1',
          name: '搜索最佳实践',
          tool: 'search_web',
          params: {
            query: '${language} 编程最佳实践',
          },
          nextSteps: ['step2'],
        },
        {
          id: 'step2',
          name: '执行代码',
          tool: 'execute_code',
          params: {
            code: '${code}',
            language: '${language}',
          },
          nextSteps: ['step3'],
        },
        {
          id: 'step3',
          name: '性能计算',
          tool: 'calculate',
          params: {
            expression: '1000 / ${step_step2.time || 1}',
          },
        },
      ],
      startStep: 'step1',
      variables: {
        language: 'python',
        code: 'print("Hello World")',
      },
    },
    example: '搜索编程最佳实践，执行代码，分析性能',
  },
];

