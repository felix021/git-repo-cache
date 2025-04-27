const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function run() {
  try {
    const runnerToolCache = process.env.RUNNER_TOOL_CACHE;
    const githubWorkspace = process.env.GITHUB_WORKSPACE;
    const githubRepository = process.env.GITHUB_REPOSITORY;
    const isPost = process.env.STATE_isPost === 'true';

    if (!runnerToolCache || !githubWorkspace || !githubRepository) {
      throw new Error('Required environment variables are not set');
    }

    const gitCacheDir = path.join(runnerToolCache, 'git-repo-cache', githubRepository);
    core.exportVariable('GIT_CACHE_DIR', gitCacheDir);

    if (!isPost) {
      // main phase: Load cache if exists
      if (fs.existsSync(path.join(gitCacheDir, '.git'))) {
        console.log('Loading Git cache...');
        execSync(`cp -r "${path.join(gitCacheDir, '.git')}" "${githubWorkspace}/"`, { stdio: 'inherit' });
      } else {
        console.log('No Git cache found.');
      }
      core.saveState('isPost', 'true');
    } else {
      // Post-run phase: Save cache
      console.log('Saving Git cache...');
      fs.mkdirSync(gitCacheDir, { recursive: true });
      execSync(`rm -rf "${path.join(gitCacheDir, '.git')}"`, { stdio: 'inherit' });
      execSync(`cp -r "${path.join(githubWorkspace, '.git')}" "${gitCacheDir}/"`, { stdio: 'inherit' });
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();