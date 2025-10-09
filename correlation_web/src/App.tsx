import { useQuery } from '@tanstack/react-query';

export default function() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['hello'],
    queryFn: async function() {
      const response = await fetch('http://localhost:8000/');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    },
  });

  if (isLoading) {
    return <p>Loading</p>;
  }

  if (error) {
    return <p>{error.message}</p>
  }

  return (<code>
    {JSON.stringify(data)}
  </code>);
}