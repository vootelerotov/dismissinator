#!/usr/bin/env node

import { Command } from 'commander';
import { Octokit } from '@octokit/rest';
import type { components } from "@octokit/openapi-types";

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
      const response = await octokit.rest.dependabot.listAlertsForRepo({
        state: 'open',
        owner: 'sympower',
        repo: 'msa-greece-resource-selection'
      });

      console.log('Found vulnerabilities:');
      response.data.forEach((alert: components["schemas"]["dependabot-alert"]) => {
        console.log(`\nAlert Number: ${alert.number}`);
        console.log(`State: ${alert.state}`);
        console.log(`Security Advisory: ${alert.security_advisory?.summary}`);
        console.log(`Package Name: ${alert.dependency?.package?.name}`);
        console.log(`Severity: ${alert.security_advisory?.severity}`);
        console.log(`CVSS Score: ${alert.security_advisory?.cvss?.score}`);
        console.log(`Created: ${alert.created_at}`);
      });
    } catch (error: any) {
      console.error('Error fetching vulnerabilities:', error?.message || 'Unknown error');
      process.exit(1);
    }
  });

program.parse();
