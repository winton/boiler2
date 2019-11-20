import globby from "globby"
import path from "path"

export const defaultGlobs = {
  actions: "actions/*/*.js",
  generators: "generators/*.js",
  projects: "projects/*.js",
  prompts: "prompts/*.js",
}

export interface ProjectType {
  title: string
  generators: string[]
  actions?: string[]
  prompts?: string[]
  description?: string
}

export interface GeneratorType {
  title: string
  prompts: string[]
  actions: string[]
  description?: string
}

export interface PromptType {
  type: string
  name: string
  message: string
  default?: string
}

export interface GroupsType {
  actions: Record<string, any>
  projects: Record<string, ProjectType>
  generators: Record<string, GeneratorType>
  prompts: Record<string, PromptType>
}

export class Groups {
  constructor(public globs = defaultGlobs) {}

  build(
    boilerPath: string = path.join(__dirname, "../boiler")
  ): GroupsType {
    const groups = this.retrieve(boilerPath)
    this.resolvePrompts(groups)
    return groups
  }

  retrieve(boilerPath: string): GroupsType {
    return Object.keys(this.globs).reduce((m, k) => {
      const paths = globby.sync(
        path.join(boilerPath, this.globs[k])
      )

      m[k] = paths.reduce(function(m, p) {
        const base = path.basename(p, ".js")
        return Object.assign(m, { [base]: require(p) })
      }, {})

      return m
    }, {}) as GroupsType
  }

  resolvePrompts(groups: GroupsType): void {
    if (!groups.projects || !groups.prompts) {
      return
    }

    for (const projectName in groups.projects) {
      const project = groups.projects[projectName]
      const prompts = {}

      for (const generatorName of project.generators) {
        const generator = groups.generators[generatorName]

        for (const prompt of generator.prompts) {
          prompts[prompt] = true
        }
      }

      project.prompts = Object.keys(prompts).concat(
        "generators"
      )
    }
  }
}
