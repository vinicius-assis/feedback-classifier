import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { StatBucket } from '@feedback-classifier/shared';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ClassificationChart } from './ClassificationChart';
import { FeatureAreaChart } from './FeatureAreaChart';
import { SentimentChart } from './SentimentChart';
import { SourceMixChart } from './SourceMixChart';
import { UrgencyChart } from './UrgencyChart';

const CHARTS = [
  { name: 'By sentiment', Chart: SentimentChart },
  { name: 'By urgency', Chart: UrgencyChart },
  { name: 'By feature area', Chart: FeatureAreaChart },
  { name: 'Classification health', Chart: ClassificationChart },
  { name: 'Source mix', Chart: SourceMixChart },
] as const;

const POPULATED: StatBucket[] = [
  { _id: 'positive', count: 5 },
  { _id: 'high', count: 3 },
  { _id: 'payments', count: 2 },
  { _id: 'success', count: 7 },
  { _id: 'web_form', count: 4 },
  { _id: null, count: 1 },
];

describe.each(CHARTS)('$name', ({ name, Chart }) => {
  it('renders its title while loading', () => {
    renderWithProviders(<Chart buckets={undefined} isLoading />);
    expect(screen.getByText(name)).toBeInTheDocument();
  });

  it('renders with undefined buckets once loading settles', () => {
    renderWithProviders(<Chart buckets={undefined} isLoading={false} />);
    expect(screen.getByText(name)).toBeInTheDocument();
  });

  it('renders with an empty bucket list', () => {
    renderWithProviders(<Chart buckets={[]} isLoading={false} />);
    expect(screen.getByText(name)).toBeInTheDocument();
  });

  it('renders with populated buckets, including a null _id', () => {
    renderWithProviders(<Chart buckets={POPULATED} isLoading={false} />);
    expect(screen.getByText(name)).toBeInTheDocument();
  });
});

describe('SourceMixChart totals', () => {
  it('rolls unrecognized sources into "Other"', () => {
    renderWithProviders(
      <SourceMixChart
        buckets={[
          { _id: 'web_form', count: 3 },
          { _id: 'slack_like', count: 2 },
        ]}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('omits "Other" when every source is a known one', () => {
    renderWithProviders(
      <SourceMixChart buckets={[{ _id: 'web_form', count: 3 }]} isLoading={false} />,
    );

    expect(screen.queryByText('Other')).not.toBeInTheDocument();
  });
});

describe('ClassificationChart totals', () => {
  it('sums success and failed into the header total', () => {
    renderWithProviders(
      <ClassificationChart
        buckets={[
          { _id: 'success', count: 8 },
          { _id: 'failed', count: 2 },
        ]}
        isLoading={false}
      />,
    );

    expect(screen.getByText('10 total')).toBeInTheDocument();
  });

  it('reports zero total when there are no runs', () => {
    renderWithProviders(<ClassificationChart buckets={[]} isLoading={false} />);
    expect(screen.getByText('0 total')).toBeInTheDocument();
  });
});
