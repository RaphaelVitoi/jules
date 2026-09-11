#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { execFile, ExecFileException } from 'node:child_process';

const server = new McpServer({
  name: 'jules-mcp-server',
  version: '0.1.0',
});

export async function startNewJulesTask(
  {
    repo_name,
    user_task_description,
  }: {
    repo_name: string;
    user_task_description: string;
  },
  dependencies?: { execFile?: typeof execFile }
): Promise<CallToolResult> {
  const execFileFn = dependencies?.execFile ?? execFile;
  return new Promise((resolve) => {
    execFileFn('jules', ['remote', 'new', '--repo', repo_name, '--session', user_task_description], { encoding: 'utf8' }, (error: ExecFileException | null, stdout: string, stderr: string) => {
      if (error) {
        resolve({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }),
            },
          ],
        });
        return;
      }
      if (stderr) {
        resolve({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ stderr }),
            },
          ],
        });
        return;
      }
      resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ stdout }),
          },
        ],
      });
    });
  });
}

server.registerTool(
  'start_new_jules_task',
  {
    description: 'Starts a new Jules task.',
    inputSchema: {
      repo_name: z.string().describe('The name of the repository in username/repo_name format.'),
      user_task_description: z.string().describe('The description of the user task.'),
    },
  },
  (input: {
    repo_name: string;
    user_task_description: string;
  }) => startNewJulesTask(input, { execFile })
);

async function startServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.env.NODE_ENV !== 'test') {
  await startServer();
}

export default server;
