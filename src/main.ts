import * as core from '@actions/core'
import {getOctokit} from '@actions/github'

async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token', {required: true})
    const packageName = core.getInput('package-name')
    const personalAccount = core.getInput('personal-account')
    const repository = core.getInput('repository')
    const github = getOctokit(token)

    const accountType = personalAccount ? 'users' : 'orgs'
    const [owner, repo] = repository.split('/')
    const pkg = packageName || repo
    const getUrl = `GET /${accountType}/${owner}/packages/container/${pkg}/versions`

    const {data: versions} = await github.request(getUrl)

    const delRequests: Promise<unknown>[] = []
    for (const version of versions) {
      const {metadata} = version
      const {container} = metadata
      const {tags} = container
      const {id} = version

      if (!tags.length) {
        const delUrl = `DELETE /${accountType}/${owner}/packages/container/${pkg}/versions/${id}`
        delRequests.push(github.request(delUrl))
      }
    }
    try {
      await Promise.all(delRequests)
      core.info(`successfully deleted untagged images`)
    } catch (error) {
      core.info(`failed to delete untagged images`)
      core.setFailed((error as Error).message)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
