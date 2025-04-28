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
        console.log('Git cache loaded.');
      } else {
        console.log('No Git cache found.');
      }
      core.saveState('isPost', 'true');
    } else {
      // Post-run phase: Save cache
      console.log('Saving Git cache...');
      fs.mkdirSync(gitCacheDir, { recursive: true });

      // rm -rf .git.new .git.old
      execSync(`rm -rf "${path.join(gitCacheDir, '.git.old')}"`, { stdio: 'inherit' });
      execSync(`rm -rf "${path.join(gitCacheDir, '.git.new')}"`, { stdio: 'inherit' });

      // cp -r .git .git.new
      execSync(`cp -r "${path.join(githubWorkspace, '.git')}" "${gitCacheDir}/.git.new"`, { stdio: 'inherit' });

      // mv -f .git .git.old
      execSync(`mv -f "${path.join(gitCacheDir, '.git')}" "${path.join(gitCacheDir, '.git.old')}"`, { stdio: 'inherit' });

      // mv -f .git.new .git
      execSync(`mv -f "${path.join(gitCacheDir, '.git.new')}" "${path.join(gitCacheDir, '.git')}"`, { stdio: 'inherit' });

      // rm -rf .git.old
      execSync(`rm -rf "${path.join(gitCacheDir, '.git.old')}"`, { stdio: 'inherit' });
      console.log('Git cache saved.');
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();