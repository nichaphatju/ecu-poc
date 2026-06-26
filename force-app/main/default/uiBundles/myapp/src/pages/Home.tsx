import { createDataSDK, gql } from '@salesforce/sdk-data';
import { useEffect, useState } from 'react';

const QUERY = gql `
  query SingleContact {
    uiapi {
        query {
          Contact {
            edges {
              node {
                Id
                Name @optional {
                  value
                }
                Title @optional {
                  value
                }
              }
            }
          }
        }
    }
  }
`;

interface SingleContactQueryResult {
  uiapi: {
    query: {
      Contact: {
        edges: Array<{
          node: {
            Id: string;
            Name?: { value: string | null };
            Title?: { value: string | null };
          }
        }>;
      }
    }
  }
}

interface Contact {
  Id: string;
  Name: string;
  Title: string;
}

export default function Home() {

  const [contacts, setContacts] = useState<Contact[] | null>();

  useEffect(() => {
    async function fetch() {
      const sdk =  await createDataSDK();
      const result = await sdk.graphql?.<SingleContactQueryResult>({
        query: QUERY
      })

      if(result?.errors?.length){
        console.log('error');
        return;
      }

      const edges = result?.data?.uiapi?.query?.Contact?.edges;
      if(!edges || edges.length == 0){
        setContacts(null);
        return;
      }

      const records: Contact[] = edges.map(edge => {
        return {
          Id: edge?.node?.Id ?? '',
          Name: edge?.node?.Name?.value ?? '',
          Title: edge?.node?.Title?.value ?? ''
        }
      })

      setContacts(records);
    }

    fetch();

  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Home</h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to your React application.
        </p>

        {contacts && contacts.length ? (
          contacts.map(contact => (
            <div className="p-2 m-2 border-2" key={contact.Id}>
              <h2>{contact.Name}</h2>
              <p>{contact.Title}</p>
            </div>
          ))
        ) : (
          <p> No contacts </p>
        )}

      </div>
    </div>
  );
}
