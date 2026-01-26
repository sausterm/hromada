// TODO: Public project detail page
export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <h1>Project {params.id}</h1>
    </main>
  );
}
