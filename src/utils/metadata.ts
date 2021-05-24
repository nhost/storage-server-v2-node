import axios from "axios";
import { GRAPHQL_ENGINE_BASE_URL, HASURA_GRAPHQL_ADMIN_SECRET } from "./config";

// https://hasura.io/docs/latest/graphql/core/api-reference/metadata-api/table-view.html#pg-track-table
export async function applyMetadata(): Promise<void> {
  try {
    await axios.post(
      `${GRAPHQL_ENGINE_BASE_URL}/v1/query`,
      {
        type: "track_table",
        args: {
          table: {
            schema: "storage",
            name: "files",
          },
        },
      },
      {
        headers: {
          "x-hasura-admin-secret": HASURA_GRAPHQL_ADMIN_SECRET,
        },
      }
    );
  } catch (error) {
    if (error.response.data.code !== "already-tracked") {
      console.log("Unable to track table");
      console.log(error.response.data);
      throw error;
    }
  }
}
