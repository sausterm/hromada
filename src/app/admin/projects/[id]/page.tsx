// TODO: Admin project edit page
export default function AdminProjectPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <h1>Edit Project {params.id}</h1>
    </main>
  );
}
