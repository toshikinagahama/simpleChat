import Link from 'next/link';
import { useRouter } from 'next/router';

export default ({}) => {
  const router = useRouter();
  const { id } = router.query;
  console.log(router.query);
  return (
    <div>
      <p>User: {id}</p>
      <Link href="/">
        <a>Back</a>
      </Link>
    </div>
  );
};
