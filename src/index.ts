#!/usr/bin/env node

import { Command } from 'commander';
import { Octokit } from '@octokit/rest';

const program = new Command();

program
  .name('disseminator')
  .description('Simple file command-line tool')
  .version('1.0.0')
  .option('-t, --token <token>', 'GitHub personal access token')
  .option('-o, --org <organization>', 'GitHub organization name')
  .option('-u, --user <username>', 'GitHub username');

program
  .command('vulnerabilities')
  .description('Get vulnerabilities for the organization')
  .action(async () => {
    const options = program.opts();
    
    if (!options.token) {
      console.error('Error: GitHub token is required. Use -t or --token option.');
      process.exit(1);
    }

    if (!options.org) {
      console.error('Error: GitHub organization is required. Use -o or --org option.');
      process.exit(1);
    }

    const octokit = new Octokit({
      auth: options.token
    });

    try {
      const response = await octokit.rest.dependabot.listOrgAlerts({
        org: options.org,
        state: 'open'
      });

      console.log('Found vulnerabilities:');
      response.data.forEach(vuln => {
        console.log(`\nRepository: ${vuln.repository.name}`);
        console.log(`Package: ${vuln.security_vulnerability.package.name}`);
        console.log(`Severity: ${vuln.security_vulnerability.severity}`);
        console.log(`Details: ${vuln.security_vulnerability.description}`);
      });
    } catch (error) {
      console.error('Error fetching vulnerabilities:', error.message);
      process.exit(1);
    }
  });

program.parse();
