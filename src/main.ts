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
    core.info(`found versions: ${versions}`)

    for (const version of versions) {
      const {metadata} = version
      const {container} = metadata
      const {tags} = container
      const {id} = version

      if (!tags.length) {
        try {
          const delUrl = `DELETE /${accountType}/${owner}/packages/container/${pkg}/versions/${id}`
          await github.request(delUrl)
          core.info(
            `successfully deleted untagged image version: ${pkg} (${id})`
          )
        } catch (error) {
          core.info(`failed to delete untagged image version: ${pkg} (${id})`)
          core.setFailed((error as Error).message)
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
