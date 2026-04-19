import LoadingPage from "../components/LoadingPage"


export default function Page() {
  return (<>
    <title>Loading Page | MMWA</title>
    <div className={"page"} id={"loading"} style={{
        width: "90vw", height: "90vh"
    }}>
      <LoadingPage />
    </div>
    </>
  )
}
