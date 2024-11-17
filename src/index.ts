#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('disseminator')
  .description('Simple file command-line tool')
  .version('1.0.0');

// Add your commands here
program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log('Hello from disseminator!');
  });

program.parse();
