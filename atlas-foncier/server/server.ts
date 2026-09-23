import 'dotenv/config';
import { createApp, analytics, genie, server } from '@databricks/appkit';

createApp({
  plugins: [
    analytics(),
    genie({
      spaces: {
        // « PLU Règlement - Q&A » — règles d'urbanisme (workspace.silver.plu_chunks)
        plu: process.env.DATABRICKS_GENIE_SPACE_ID ?? '01f1b74de1e017db858e23e4b1db2bfe',
      },
    }),
    server(),
  ],
}).catch(console.error);
