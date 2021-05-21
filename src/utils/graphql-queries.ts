import gql from "graphql-tag";

export const INSERT_FILE = gql`
  mutation ($object: storage_files_insert_input!) {
    insert_storage_files_one(object: $object) {
      id
    }
  }
`;

export const GET_FILE = gql`
  query ($id: uuid!) {
    storage_files_by_pk(id: $id) {
      id
    }
  }
`;
