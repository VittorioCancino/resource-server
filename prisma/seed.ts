function main(): void {
  console.log(
    'No default users are seeded. Services bootstrap maintainer accounts through resource-server APIs.',
  );
}

try {
  main();
} catch (error: unknown) {
  console.error('Failed to seed database');
  console.error(error);
  process.exit(1);
}
