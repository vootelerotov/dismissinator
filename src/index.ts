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

const vulnerabilitiesCommand = program
  .command('vulnerabilities')
  .description('Get vulnerabilities for the organization or repository');

vulnerabilitiesCommand
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

vulnerabilitiesCommand
  .command('dismiss')
  .description('Dismiss a vulnerability alert')
  .requiredOption('--alert-number <number>', 'Alert number to dismiss')
  .requiredOption('--reason <reason>', 'Reason for dismissal (fix-started|inaccurate|no-bandwidth|not-used|tolerable-risk)')
  .addOption(new Command.Option('--reason <reason>')
    .choices(['fix-started', 'inaccurate', 'no-bandwidth', 'not-used', 'tolerable-risk']))
  .option('--comment <comment>', 'Additional comment for dismissal')
  .action(async (options) => {
    const programOptions = program.opts();
    
    if (!programOptions.token) {
      console.error('Error: GitHub token is required. Use -t or --token option.');
      process.exit(1);
    }

    if (!programOptions.repo) {
      console.error('Error: Repository (-r, --repo) must be specified for dismissing alerts.');
      process.exit(1);
    }

    const octokit = new Octokit({
      auth: programOptions.token
    });

    try {
      if (programOptions.dryRun) {
        console.log('Dry run mode - would dismiss vulnerability:');
        console.log(`Alert Number: ${options.alertNumber}`);
        console.log(`Dismissal Reason: ${options.reason}`);
        console.log(`Comment: ${options.comment || 'None'}`);
        console.log(`Repository: ${programOptions.repo}`);
        return;
      }

      const parts = programOptions.repo.split('/');
      if (parts.length !== 2) {
        console.error('Error: Repository must be in format owner/repo');
        process.exit(1);
      }
      const [owner, repo] = parts;

      await octokit.rest.dependabot.updateAlert({
        owner,
        repo,
        alert_number: parseInt(options.alertNumber),
        state: 'dismissed',
        dismissal_reason: options.reason.replace(/-/g, '_'),
        dismissed_comment: options.comment || "No comment provided"
      });

      console.log(`Successfully dismissed alert ${options.alertNumber} with reason: ${options.reason}`);
    } catch (error: any) {
      console.error('Error dismissing vulnerability:', error?.message || 'Unknown error');
      process.exit(1);
    }
  });

program.parse();
