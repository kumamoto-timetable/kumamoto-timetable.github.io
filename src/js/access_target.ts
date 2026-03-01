const accessTargets = {
  dev: {
    medas: {
      url: 'http://localhost:3110/v1/graphql',
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJ1aWQiOiIzMTZiN2Y0Yi1iYjI0LTQ2MTUtYWYzNS1mNTIwM2JkYTU1YjMiLCJ0b2tlbiI6IjhmMjBhZjEzLWY3MjktNGZlZC1hNWIyLWQ3NmZjNTQ3M2JlYiIsImlhdCI6MTY4ODY1Nzc0Mn0.Qz04mOSvJOU256U9UFbj96qvZFFjZPTUsSnegaCbRns',
    },
    agencyIds: [
      '9330001001600',
      '3330001008122',
      '1330001001517',
      '9330001006723',
    ]
  },
  stg: {
    medas: {
      url: 'http://localhost:3110/v1/graphql',
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJ1aWQiOiIzMTZiN2Y0Yi1iYjI0LTQ2MTUtYWYzNS1mNTIwM2JkYTU1YjMiLCJ0b2tlbiI6IjhmMjBhZjEzLWY3MjktNGZlZC1hNWIyLWQ3NmZjNTQ3M2JlYiIsImlhdCI6MTY4ODY1Nzc0Mn0.Qz04mOSvJOU256U9UFbj96qvZFFjZPTUsSnegaCbRns',
    },
    agencyIds: [
      '9330001001600',
      '3330001008122',
      '1330001001517',
      '9330001006723',
    ]
  },
  prod: {
    medas: {
      url: 'https://api-norumes.momizi.codes/v1/graphql',
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJ1aWQiOiJlNmVjODIyOS03ODFlLTRhYjMtODRkNS1kNmI3OTViZTEzNzUiLCJ0b2tlbiI6ImFjNGM1YzA3LTZjM2MtNGE1MC05YTVmLTkzNTUwOWE4YTlhMyIsImlhdCI6MTY4ODkxODQxOH0.Oc1AUVVIN3EUsad5Ii8yl34eYNBsujoHa7KxR3EMmkU',
    },
    agencyIds: [
      '9330001001600',
      '3330001008122',
      '1330001001517',
      '9330001006723',
    ]
  }
}

export const accessTarget = accessTargets['prod']
