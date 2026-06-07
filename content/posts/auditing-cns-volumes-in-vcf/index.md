---
title: "Auditing CNS Volumes in VCF"
date: 2026-01-06T18:11:28.989Z
draft: false
summary: "Learn how to effectively audit CNS volumes in VCF using a Python script to gain insights into volumes from a namespace-based view"
tags: ["kubernetes", "cloud-native", "vcf", "vsphere", "cns"]
---

When deploying VKS clusters, VMs, or Pods that use extra volumes in VCF with the Supervisor, the volumes are managed through PVCs and in turn PVs. These PVs create [CNS(Cloud Native Storage)](https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/container-storage-plugin/3-0/getting-started-with-vmware-vsphere-container-storage-plug-in-3-0/vsphere-container-storage-plug-in-concepts.html) volumes which integrate vSphere and Kubernetes to enable the creation and management of container volumes in a vSphere environment. This is an extremely common thing to do when deploying a VKS cluster for example , you usually add additional volumes to the nodes for additional storage of images( `var/lib/containerd`). This additional volume is managed through a PVC and ultimately a PV.

One challenge with this from an administrator point of view is getting insight into all of the volumes and what they are being used for and where. vCenter does have a native UI to explore these and filter them and [govc](https://github.com/vmware/govmomi/blob/main/govc/USAGE.md#volumels) can also be used to query them with the CLI, however many times I want to see these volumes from a namespace and PVC based view. It can also be challenging to associate the volumes with the PVC when looking through the raw details from the govc output. That’s why I created [this simple python script](https://github.com/warroyo/cns-tooling/tree/main/pvc-audit) to help with getting the details for volumes based on a Supervisor namespace.

The script used both kubectl output and govc output and correlates the PVCs to the underlying CNS volumes, it then returns relevant details about the volumes as well as sorts them between node volumes and volumes that are being used in the clusters for workload PVCs.

## Example Usage

let’s say I have a supervisor namespace called `gitops-932tv` and in that namespace I have a VKS cluster deployed. Also in that cluster I have an app deployed that uses a number of persistent disks. As an administrator I may need to determine where these volumes are located on my datastores and also get some details like there volume IDs etc. in case I need to relocate them. To get this info I can simple run the following.

1. Setup the kube context and govc details
    
    ```bash
    # sets the kube context
    vcf context use <supervisor-conext>
    export GOVC_INSECURE=true
    export GOVC_PASSWORD='password'
    export GOVC_USERNAME=administrator@vsphere.local
    export GOVC_URL=https://vcsa.myorg.com
    ```
    
2. clone the repo and run the script
    
    ```bash
    git clone https://github.com/warroyo/cns-tooling
    cd cns-tooling/pvc-audit
    python3 vks_disk_audit.py gitops-932tv
    ```
    

With those two steps the output will look similar to this. You will notice that the we get two separate sections, one for node volumes and one for in cluster volumes. The node volumes section shows which node the volumes are attached to as well as details about the size, cluster, datastore etc. For the in cluster volumes, these are typically PVCs used by workloads in the cluster, these show similar details but also include the referred entity metadata about the PVC name in the cluster and which pod is using it.

```bash
--- Starting Audit for Namespace: gitops-932tv ---
Mapping VSphereMachines to Clusters...
Mapped 2 nodes across clusters.
Querying all PVCs in namespace...
Found 7 PVC(s). Resolving PV handles...
Querying vSphere CNS for 7 volumes...


=======================================================================================
                             NODE VOLUMES (Attached)
=======================================================================================
PVC Name                       Node                           Cluster              Volume Name                         Volume ID                                Datastore            Capacity   Referred Entity
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
tfd-1-8q26s-ql69w-vol-b9xl     tfd-1-8q26s-ql69w              tfd-1                pvc-9e7d6921-d573-4203-ad8a-9e420f490446 560fd41e-f243-4c96-997e-8bf7b7996e95     vsan:8740804e6737443c-b388c53757aaaf93/ 20.00 GB   -
tfd-1-tfd-1-jrxdt-pmhmn-cv4hj-vol-b9xl tfd-1-tfd-1-jrxdt-pmhmn-cv4hj  tfd-1                pvc-2417b407-2bed-4cdb-88fb-7b1ebf6653ad ecfffa9d-483c-4fe1-a391-e4fe1986e52d     vsan:8740804e6737443c-b388c53757aaaf93/ 20.00 GB   -


=======================================================================================
                             IN-CLUSTER PVCs
=======================================================================================
PVC Name                       Cluster              Volume Name                         Volume ID                                Datastore            Capacity   Referred Entity
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
f478b761-3832-4c56-8cc7-10b44e5a968b-1fb60ee1-66e8-4ce6-97a6-c7cb12070bdf tfd-1                pvc-6b57785d-828b-4f1d-ab32-7c617e60a908 2b2deeab-53cf-4551-bba4-e787dc1567d8     vsan:8740804e6737443c-b388c53757aaaf93/ 1.00 GB    PVC:music-store/order-pvc, Pod:order-service-69987cbbfd-mlj2c
f478b761-3832-4c56-8cc7-10b44e5a968b-232680b1-d8d7-4eaa-9e50-66a12bb0fb0a tfd-1                pvc-788a9fa5-6db8-4151-ad5b-3f32c5dcda16 b2c6ac20-b002-4f0a-948b-4fccef7d8c3a     vsan:8740804e6737443c-b388c53757aaaf93/ 1.00 GB    PVC:music-store/cart-pvc, Pod:cart-service-7cc8794c86-x2m6v
f478b761-3832-4c56-8cc7-10b44e5a968b-3519cba5-07ba-45a5-b329-e647a3500c34 tfd-1                pvc-b7ec835b-ef13-4b56-9fae-4f6b2c6395ce 5fd5d74c-2b77-4ecb-ae95-c4a22ae99111     vsan:8740804e6737443c-b388c53757aaaf93/ 1.00 GB    Pod:postgres-bcf8997c4-89pkj, PVC:music-store/postgres-pvc
f478b761-3832-4c56-8cc7-10b44e5a968b-7f7b7933-d67a-479c-8197-47c61708f1c6 tfd-1                pvc-92f87c6b-cfdc-4377-8a79-11d6dd6b3b1a 6fe37d12-9c30-4ab5-aaf7-7f9276e3ba49     vsan:8740804e6737443c-b388c53757aaaf93/ 1.00 GB    PVC:music-store/music-store-1-pvc
f478b761-3832-4c56-8cc7-10b44e5a968b-d1d19249-7cb0-4c7d-914e-ec866e998aaa tfd-1                pvc-06cbb085-57c3-4b27-856a-713b45e0c53b 0f28021c-c85c-4f36-b9de-faa26fedb232     vsan:8740804e6737443c-b388c53757aaaf93/ 1.00 GB    PVC:music-store/users-pvc, Pod:users-service-855678b958-9zcdb

--- Audit Complete ---
```
