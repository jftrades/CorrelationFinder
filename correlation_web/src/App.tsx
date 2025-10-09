import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


function MethodSelector() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['analysismethods'],
    queryFn: async function () {
      const response = await fetch('http://localhost:8000/analysismethods');
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

  return (
    <div>
      <h1>Choose Analysis Method</h1>
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a method" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Methods</SelectLabel>
            {data.analysis_methods.map((method: string) => (
              <SelectItem key={method} value={method}>{method}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function () {
  const { data, error, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: async function () {
      const response = await fetch('http://localhost:8000/files');
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

  console.log(data);
  return (
    <div>
      <h1>Choose Instrument</h1>
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a instrument" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Files</SelectLabel>
            {data.files.map((file: string) => (
              <SelectItem key={file} value={file}>{file}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <MethodSelector />
    </div>
  );
}