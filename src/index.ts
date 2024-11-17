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
  .option('-r, --repo <repository>', 'GitHub repository in format owner/repo')
  .option('-d, --dry-run', 'Show what would be done without making changes')
  .option('-u, --user <username>', 'GitHub username');

program
  .command('vulnerabilities')
  .description('Get vulnerabilities for the organization or repository')
  .command('list')
  .description('List open vulnerability alerts')
  .action(async () => {
    const options = program.opts();
    
    if (!options.token) {
      console.error('Error: GitHub token is required. Use -t or --token option.');
      process.exit(1);
    }

    if (!options.org && !options.repo) {
      console.error('Error: Either organization (-o, --org) or repository (-r, --repo) must be specified.');
      process.exit(1);
    }

    if (options.org && options.repo) {
      console.error('Error: Cannot specify both organization and repository. Use either -o/--org or -r/--repo.');
      process.exit(1);
    }

    const octokit = new Octokit({
      auth: options.token
    });

    try {
      if (options.dryRun) {
        console.log('Dry run mode - would fetch vulnerabilities for:');
        console.log(options.org ? `Organization: ${options.org}` : `Repository: ${options.repo}`);
        return;
      }

      let alerts: components["schemas"]["dependabot-alert"][] = [];

      if (options.org) {
        const response = await octokit.rest.dependabot.listAlertsForOrg({
          org: options.org,
          state: 'open'
        });
        alerts = response.data;
      } else {
        const parts = options.repo.split('/');
        if (parts.length !== 2) {
          console.error('Error: Repository must be in format owner/repo');
          process.exit(1);
        }
        const [owner, repo] = parts;
        const response = await octokit.rest.dependabot.listAlertsForRepo({
          owner: owner,
          repo: repo,
          state: 'open'
        });
        alerts = response.data;
      }

      console.log('Found vulnerabilities:');
      alerts.forEach((alert: components["schemas"]["dependabot-alert"]) => {
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
