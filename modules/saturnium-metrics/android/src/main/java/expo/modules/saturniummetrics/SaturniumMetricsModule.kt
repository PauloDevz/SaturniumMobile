package expo.modules.saturniummetrics

import android.app.ActivityManager
import android.content.Context
import android.os.Debug
import android.os.Process
import android.os.SystemClock
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Métricas reais do Android. Nada aqui é estimado: cada campo vem de uma API do sistema.
 * Campos que o sistema não fornece ficam ausentes (null no JS), nunca preenchidos com valor inventado.
 */
class SaturniumMetricsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("Contexto indisponível")

  override fun definition() = ModuleDefinition {
    Name("SaturniumMetrics")

    Function("getSnapshot") {
      val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      val sys = ActivityManager.MemoryInfo().also { am.getMemoryInfo(it) }

      // PSS do processo principal (KB) via Debug.MemoryInfo.
      val ownInfo = am.getProcessMemoryInfo(intArrayOf(Process.myPid())).firstOrNull()
      val ownPssKb = ownInfo?.totalPss

      // Processos do app (inclui renderizadores do WebView quando rodam em processo separado).
      val pkg = context.packageName
      val appProcesses = am.runningAppProcesses
        ?.filter { it.processName == pkg || it.processName.startsWith("$pkg:") }
        .orEmpty()
      val pids = appProcesses.map { it.pid }.toIntArray()
      val totalPssKb = if (pids.isNotEmpty())
        am.getProcessMemoryInfo(pids).sumOf { it.totalPss } else ownPssKb

      mapOf(
        "timestampMs" to SystemClock.elapsedRealtime(),
        "deviceTotalBytes" to sys.totalMem,
        "deviceAvailableBytes" to sys.availMem,
        "lowMemory" to sys.lowMemory,
        "lowMemoryThresholdBytes" to sys.threshold,
        "appPssBytes" to totalPssKb?.let { it.toLong() * 1024L },
        "mainProcessPssBytes" to ownPssKb?.let { it.toLong() * 1024L },
        "processCount" to appProcesses.size,
        // Tempo de CPU acumulado deste processo (ms). O JS calcula a % pela diferença entre amostras.
        "processCpuTimeMs" to Process.getElapsedCpuTime(),
        "heapUsedBytes" to (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory())
      )
    }
  }
}
