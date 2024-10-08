createOrUpdateEnvironmentVariables();

async function createOrUpdateEnvironmentVariables() {
  const environment = process.argv[2];

  if (!['preview', 'production'].includes(environment)) {
    throw new Error(
      'Please specify a valid environment. Valid choices are "preview" or "production."',
    );
  }

  console.log(
    'Copying environment variables to Vercel. Secrets will be copied into sensitive environment variables.',
  );

  const environmentVariableKeys = [
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
    'TURNSTILE_SECRET_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_MAPS_API_KEY',
    'VOTER_REGISTRATION_REPO_ENCRYPTION_KEY',
    'CRYPTO_KEY_COOKIES',
  ];

  for (const key of environmentVariableKeys) {
    const value = process.env[key];
    const isSensitive = !key.startsWith('NEXT_PUBLIC_');
    await createOrUpdateEnvironmentVariable(
      key,
      value,
      environment,
      isSensitive,
    );
  }

  console.log('Copied secrets to vercel.');
}

async function createOrUpdateEnvironmentVariable(
  key,
  value,
  environment,
  sensitive,
) {
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/env?upsert=true`,
    {
      body: {
        key,
        value,
        type: sensitive ? 'sensitive' : 'plain',
        target: [environment],
      },
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    console.log(response);
  }
}
