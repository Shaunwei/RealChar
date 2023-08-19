import Layout from '../components/layout';
import { Button } from '@nextui-org/button';
import { Card, CardBody } from '@nextui-org/card'; 
import { Avatar } from '@nextui-org/avatar';

export default function Home() {
  return (
    <Layout>
      <main>
        <h1 className="text-center">Real-time communication with your AI character assistant</h1>
        <div className="flex justify-center">
          <Button>Explore</Button>
          <Button>My Characters</Button>
        </div>
        <section className="flex">
          <Card>
            <CardBody>
              <Avatar radius="sm" src="" />
              <p className="name">name</p>
              <p className="description">description</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Avatar radius="sm" src="" />
            </CardBody>
          </Card>
        </section>
      </main>
    </Layout>
  )
}
