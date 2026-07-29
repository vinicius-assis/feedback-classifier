import { Box, Button, Container, Heading, Stack, Text, VStack } from '@chakra-ui/react';
import { FormEvent, useCallback, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { useIngestFile } from '../hooks/useIngest';
import { errorMessage } from '../lib/errors';
import { isAcceptedFile } from '../lib/files';
import { toaster } from '../lib/toaster';

export function IngestFilePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mutation = useIngestFile();

  const pickFile = useCallback((next: File | null) => {
    if (!next) {
      setFile(null);
      return;
    }
    if (!isAcceptedFile(next)) {
      toaster.create({
        type: 'error',
        title: 'Invalid file',
        description: 'Use a .csv or .xlsx file (one feedback per row, first column).',
      });
      return;
    }
    setFile(next);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      toaster.create({
        type: 'error',
        title: 'No file selected',
        description: 'Choose a CSV or Excel file to import.',
      });
      return;
    }

    mutation.mutate(file, {
      onSuccess: (res) => {
        const parts: string[] = [`${res.fulfilled} saved`];
        if (res.skipped > 0) {
          parts.push(`${res.skipped} skipped (blank rows / header)`);
        }
        if (res.failed > 0) {
          parts.push(`${res.failed} rejected`);
        }
        const hasIssues = res.failed > 0;
        const type = hasIssues ? 'warning' : 'success';
        toaster.create({
          type,
          title: hasIssues ? 'Import finished with issues' : 'Import complete',
          description: parts.join(' · '),
          closable: true,
        });
        if (res.errors.length > 0) {
          const preview = res.errors
            .slice(0, 5)
            .map((err) => `Row ${err.row}: ${err.message}`)
            .join('\n');
          const more = res.errors.length > 5 ? `\n… and ${res.errors.length - 5} more` : '';
          toaster.create({
            type: 'error',
            title: 'Row errors',
            description: `${preview}${more}`,
            closable: true,
          });
        }
        setFile(null);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      },
      onError: (error) => {
        toaster.create({
          type: 'error',
          title: 'Import failed',
          description: errorMessage(error),
        });
      },
    });
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" gap={6}>
        <Stack gap={1}>
          <Heading as="h1" size="xl">
            Import from file
          </Heading>
          <Text color="fg.muted">
            Upload a{' '}
            <Text as="span" fontWeight="medium">
              .csv
            </Text>{' '}
            or{' '}
            <Text as="span" fontWeight="medium">
              .xlsx
            </Text>{' '}
            with one feedback per row (first column only). Optional header row:{' '}
            <Text as="span" fontFamily="mono">
              feedback
            </Text>
            ,{' '}
            <Text as="span" fontFamily="mono">
              comments
            </Text>
            , etc. Items are stored with source{' '}
            <Text as="span" fontWeight="medium">
              web_file
            </Text>{' '}
            and classified like other ingest paths.
          </Text>
          <Text color="fg.muted" fontSize="sm">
            Prefer line-by-line paste?{' '}
            <NavLink to="/ingest/bulk">
              <Text as="span" color="fg" textDecoration="underline" _hover={{ opacity: 0.85 }}>
                Bulk ingest
              </Text>
            </NavLink>
          </Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <VStack align="stretch" gap={4}>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              style={{ display: 'none' }}
              onChange={(ev) => {
                const f = ev.target.files?.[0] ?? null;
                pickFile(f);
              }}
            />

            <Box
              role="button"
              tabIndex={0}
              borderWidth="2px"
              borderStyle="dashed"
              borderColor={isDragging ? 'blue.solid' : 'border'}
              borderRadius="md"
              px={6}
              py={10}
              textAlign="center"
              bg={isDragging ? 'bg.muted' : 'bg.subtle'}
              cursor="pointer"
              transition="border-color 0.15s ease, background 0.15s ease"
              _hover={{ borderColor: 'blue.solid' }}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragEnter={(ev) => {
                ev.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(ev) => {
                ev.preventDefault();
              }}
              onDragLeave={(ev) => {
                ev.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(ev) => {
                ev.preventDefault();
                setIsDragging(false);
                const f = ev.dataTransfer.files?.[0] ?? null;
                pickFile(f);
              }}
            >
              <Text fontWeight="medium">Drop a file here or click to browse</Text>
              <Text fontSize="sm" color="fg.muted" mt={2}>
                .csv or .xlsx · max 10 MB
              </Text>
              {file ? (
                <Text fontSize="sm" mt={3} fontFamily="mono">
                  Selected: {file.name}
                </Text>
              ) : null}
            </Box>

            <Button
              type="submit"
              loading={mutation.isPending}
              alignSelf="flex-start"
              disabled={!file}
            >
              Import and classify
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
}
