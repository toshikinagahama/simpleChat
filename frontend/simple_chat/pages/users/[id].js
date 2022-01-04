import Link from 'next/link'

export default ({ post }) => {
    console.log(post);
  return (
    <div>
      <Link href="/">

        <a>Back</a>
      </Link>
    </div>
  )
}

export const getStaticPaths = async () => {
    let paths = [{params: {id: "0"}}, {params: {id: "1"}}, {params: {id: "2"}}, {params: {id: "3"}}, {params: {id: "4"}}, {params: {id: "5"}}];
  return { paths, fallback: false }
}

export const getStaticProps = async ({ params }) => {
  return {
    props: {
        post: {id: params.id}
    },
  }
}