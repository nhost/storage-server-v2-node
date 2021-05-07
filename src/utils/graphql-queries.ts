import gql from "graphql-tag";

export const insertFile = gql`
  mutation($object: storage_files_insert_input!) {
    insert_storage_files_one(object: $object) {
      id
    }
  }
`;
